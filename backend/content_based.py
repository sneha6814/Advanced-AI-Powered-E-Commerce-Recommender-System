# content_based_recommender.py
import requests
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

# Fetch from backend API
response = requests.get("http://localhost:5000/api/products")
products = response.json()

# Create DataFrame
df = pd.DataFrame(products)

# Create a combined text field
df["text"] = df["name"] + " " + df["brand"] + " " + df["category"]

# TF-IDF Vectorization
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df["text"])

cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

# Recommendation function
def recommend(product_name, top_n=5):
    if product_name not in df["name"].values:
        return []
    
    idx = df[df["name"] == product_name].index[0]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:top_n+1]
    product_indices = [i[0] for i in sim_scores]
    return df.iloc[product_indices][["name", "brand", "category"]].to_dict(orient="records")

# Example usage
if __name__ == "__main__":
    result = recommend("Apple Watch")
    for r in result:
        print(r)
