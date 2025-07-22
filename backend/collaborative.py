# collaborative.py
"""
Simple user-based collaborative-filter recommender
-------------------------------------------------
• Pulls orders from your Node API (`/api/orders/admin/all-orders`)
• Builds a user-product interaction matrix
• Computes cosine similarity between users
• Recommends products bought by similar users
-------------------------------------------------
Requirements:
pip install pandas requests scikit-learn
"""

import pandas as pd
import requests
from sklearn.metrics.pairwise import cosine_similarity
import sys, json

# -------------------------------------------------------------------
# 0) CONFIG — paste your *admin* JWT token here
# -------------------------------------------------------------------
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGE1N2Y5YjJlOGMyNjBjM2UxNjE0YiIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUwODgyNDA3LCJleHAiOjE3NTA5Njg4MDd9.sK-3YDPYcsPU2vohuwKsOH7axohpxsOxWyW7XtAw1J0"          # <---- replace with real token

API_URL = "http://localhost:5000/api/orders/admin/all-orders"
HEADERS  = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}

# -------------------------------------------------------------------
# 1) FETCH ORDERS
# -------------------------------------------------------------------
try:
    res = requests.get(API_URL, headers=HEADERS, timeout=10)
    res.raise_for_status()
except Exception as e:
    print("❌  Could not reach API:", e)
    sys.exit(1)

try:
    orders = res.json()
except json.JSONDecodeError:
    print("❌  API did not return JSON.\nRaw text:", res.text[:300])
    sys.exit(1)

if not isinstance(orders, list) or not orders:
    print("⚠️  No orders returned from API.")
    sys.exit(0)

print("✓ Orders fetched:", len(orders))

# -------------------------------------------------------------------
# 2) BUILD [userId, productId] RECORDS
# -------------------------------------------------------------------
records = []

for order in orders:
    if not isinstance(order, dict):
        continue

    # userId may be a string or populated object
    uid_field = order.get("userId")
    user_id = (
        str(uid_field.get("_id")) if isinstance(uid_field, dict) else str(uid_field)
    )

    for item in order.get("products", []):
        pid = item.get("productId", item.get("_id", item.get("name")))
        if isinstance(pid, dict):               # populated obj
            pid = str(pid.get("_id"))
        else:
            pid = str(pid)
        records.append({"userId": user_id, "productId": pid})

if not records:
    print("⚠️  No user-product interactions found.")
    sys.exit(0)

# -------------------------------------------------------------------
# 3) CREATE USER-PRODUCT MATRIX
# -------------------------------------------------------------------
df = pd.DataFrame(records)
user_product = df.pivot_table(
    index="userId", columns="productId", aggfunc=len, fill_value=0
)

if user_product.shape[0] < 2 or user_product.shape[1] < 2:
    print("⚠️  Need at least 2 users and 2 products for collaborative filtering.")
    sys.exit(0)

# -------------------------------------------------------------------
# 4) COMPUTE USER COSINE SIMILARITY
# -------------------------------------------------------------------
cos_sim = cosine_similarity(user_product)
sim_df  = pd.DataFrame(cos_sim, index=user_product.index, columns=user_product.index)

# -------------------------------------------------------------------
# 5) RECOMMEND FUNCTION
# -------------------------------------------------------------------
def recommend_products(target_user_id: str, top_n: int = 5):
    """Return top_n product IDs recommended for target_user_id."""
    if target_user_id not in sim_df.columns:
        return []

    # Users most similar to target (exclude self)
    similar_users = sim_df[target_user_id].sort_values(ascending=False)[1:4].index

    # Products similar users bought
    peer_purchases = df[df["userId"].isin(similar_users)]
    already_bought = set(df[df["userId"] == target_user_id]["productId"])

    recs = (
        peer_purchases[~peer_purchases["productId"].isin(already_bought)]
        .productId.value_counts()
        .head(top_n)
        .index.tolist()
    )
    return recs

# -------------------------------------------------------------------
# 6) DEMO
# -------------------------------------------------------------------
sample_user = user_product.index[0]
print(f"\nRecommendations for user {sample_user}:")
print(recommend_products(sample_user, top_n=5))
