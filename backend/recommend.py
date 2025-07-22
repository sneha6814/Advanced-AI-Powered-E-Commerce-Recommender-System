import pandas as pd
import requests
import sys
import json
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# --------------------------
# 0. Get userId from CLI args
# --------------------------
if len(sys.argv) < 2:
    print(json.dumps({"error": "Missing user ID"}))
    sys.exit(1)

target_user_id = sys.argv[1]

# --------------------------
# 1. Config
# --------------------------
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NWM4NmFlNzg3NGQ2MmI5ZmY1ODUwMSIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUyNzcyODEyLCJleHAiOjE3NTI4NTkyMTJ9.4RD3aq9OJPkWpgv6Vf8idfmYLiVfsSGrqNKekIUJaUM"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

API_ORDERS_URL = "http://localhost:5000/api/orders/admin/all-orders"
API_PRODUCTS_URL = "http://localhost:5000/api/products"

# --------------------------
# 2. Fetch orders
# --------------------------
try:
    res = requests.get(API_ORDERS_URL, headers=HEADERS, timeout=10)
    res.raise_for_status()
    orders = res.json()
except Exception as e:
    print(json.dumps({"error": f"Failed to fetch orders: {str(e)}"}))
    sys.exit(1)

# --------------------------
# 3. Build user-product pairs
# --------------------------
records = []
for order in orders:
    uid_field = order.get("userId")
    user_id = uid_field.get("_id") if isinstance(uid_field, dict) else uid_field
    for item in order.get("products", []):
        pid = item.get("productId", item.get("_id", item.get("name")))
        pid = pid.get("_id") if isinstance(pid, dict) else pid
        records.append({"userId": str(user_id), "productId": str(pid)})

if not records:
    print(json.dumps([]))
    sys.exit(0)

# --------------------------
# 4. Create user-product matrix for collaborative filtering
# --------------------------
df = pd.DataFrame(records)
user_product = df.pivot_table(index="userId", columns="productId", aggfunc=len, fill_value=0)

if target_user_id not in user_product.index or user_product.shape[0] < 2:
    # Not enough data for collaborative filtering
    collab_recs = []
else:
    # --------------------------
    # 5. Collaborative filtering
    # --------------------------
    cos_sim = cosine_similarity(user_product)
    sim_df = pd.DataFrame(cos_sim, index=user_product.index, columns=user_product.index)
    similar_users = sim_df[target_user_id].sort_values(ascending=False)[1:4].index
    peer_purchases = df[df["userId"].isin(similar_users)]
    already_bought = set(df[df["userId"] == target_user_id]["productId"])
    collab_recs = (
        peer_purchases[~peer_purchases["productId"].isin(already_bought)]
        .productId.value_counts()
        .head(10)  # get more to combine later
        .index
        .tolist()
    )

# --------------------------
# 6. Fetch products data for content-based filtering
# --------------------------
try:
    prod_res = requests.get(API_PRODUCTS_URL)
    prod_res.raise_for_status()
    products = prod_res.json()
except Exception as e:
    print(json.dumps({"error": f"Failed to fetch products: {str(e)}"}))
    sys.exit(1)

df_products = pd.DataFrame(products)

# Prepare text data for TF-IDF
df_products["text"] = df_products["name"].fillna('') + " " + df_products["brand"].fillna('') + " " + df_products["category"].fillna('')

tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df_products["text"])
cosine_sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

# Get products user already bought
bought_product_ids = list(already_bought) if 'already_bought' in locals() else []

# If user hasn't bought anything, skip content-based recommendations
if not bought_product_ids:
    content_recs = []
else:
    # Map productId to index in df_products
    prod_id_to_idx = {str(pid): idx for idx, pid in enumerate(df_products["_id"].astype(str))}
    
    sim_scores_accum = {}
    for pid in bought_product_ids:
        if pid not in prod_id_to_idx:
            continue
        idx = prod_id_to_idx[pid]
        sim_scores = list(enumerate(cosine_sim_matrix[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:11]  # top 10 similar products
        for i, score in sim_scores:
            pid_sim = str(df_products.iloc[i]["_id"])
            if pid_sim in bought_product_ids:
                continue  # don't recommend products already bought
            sim_scores_accum[pid_sim] = sim_scores_accum.get(pid_sim, 0) + score
    
    # Sort products by accumulated similarity score
    content_recs = sorted(sim_scores_accum, key=sim_scores_accum.get, reverse=True)[:10]

# --------------------------
# 7. Combine recommendations (collaborative + content)
# --------------------------
combined_recs = []

# Priority to collaborative recommendations
for pid in collab_recs:
    if pid not in combined_recs:
        combined_recs.append(pid)

# Add content-based recommendations if not already included
for pid in content_recs:
    if pid not in combined_recs:
        combined_recs.append(pid)

# --------------------------
# 8. FALLBACK: If no recommendations, return popular products overall
# --------------------------
if not combined_recs:
    combined_recs = (
        df["productId"].value_counts()
          .head(5)
          .index
          .tolist()
    )

# Limit to top 10 recommendations
combined_recs = combined_recs[:10]

print(json.dumps(combined_recs))



