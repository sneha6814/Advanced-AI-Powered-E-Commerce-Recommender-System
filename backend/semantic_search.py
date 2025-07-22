# backend/semantic_search.py
import sys
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import requests

def main():
    # Load model once
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # 1. Get query from CLI
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(0)

    query = sys.argv[1]

    # 2. Fetch products from backend
    try:
        res = requests.get("http://localhost:5000/api/products")
        res.raise_for_status()
        products = res.json()
    except Exception as e:
        print(json.dumps([]))
        sys.exit(0)

    if not products:
        print(json.dumps([]))
        sys.exit(0)

    # 3. Prepare product text and ID lists
    product_texts = [
        f"{p.get('name', '')} {p.get('brand', '')} {p.get('category', '')} {p.get('description', '')}"
        for p in products
    ]
    product_ids = [p['_id'] for p in products]

    # 4. Compute embeddings
    try:
        query_vec = model.encode([query])
        product_vecs = model.encode(product_texts)
    except Exception as e:
        print(json.dumps([]))
        sys.exit(0)

    # 5. Compute cosine similarity
    scores = cosine_similarity(query_vec, product_vecs)[0]

    # 6. Rank all product IDs by similarity
    ranked_indices = scores.argsort()[::-1]
    ranked_ids = [product_ids[i] for i in ranked_indices]

    # 7. Return full list of ranked product IDs
    print(json.dumps(ranked_ids))

if __name__ == "__main__":
    main()
