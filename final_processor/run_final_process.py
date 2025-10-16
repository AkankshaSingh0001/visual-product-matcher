import requests
import json
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import os
import certifi
import time

# --- SSL FIX & SETUP ---
os.environ["SSL_CERT_FILE"] = certifi.where()
# --- END SETUP ---

# --- CONFIGURATION ---
MODEL_NAME = 'clip-ViT-B-32'
TARGET_BOOK_COUNT = 200
OUTPUT_FILE = 'books_with_vectors.json'
# --- END CONFIGURATION ---

def fetch_book_list():
    """Fetches a list of potential books from the Open Library Search API."""
    print("Fetching initial book list from Open Library...")
    subjects = ['science', 'art', 'history', 'technology', 'fiction', 'philosophy', 'biography']
    all_docs = []
    
    for subject in subjects:
        try:
            url = f"https://openlibrary.org/search.json?subject={subject}&limit=150&fields=key,title,author_name,cover_i"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            docs_with_covers = [doc for doc in data.get('docs', []) if 'cover_i' in doc]
            all_docs.extend(docs_with_covers)
            print(f"Found {len(docs_with_covers)} potential books in '{subject}'")
        except requests.exceptions.RequestException as e:
            print(f"Warning: Could not fetch subject '{subject}'. Reason: {e}")
            
    if not all_docs:
        print("\n❌ Critical Error: Failed to fetch any book data from Open Library.")
        return None
        
    return all_docs

def process_books(docs, model):
    """Processes book data, performs a detailed fetch for categories, downloads images, and generates vectors."""
    books_with_vectors = []
    
    for work in tqdm(docs, desc="Processing books (2-step fetch for categories)"):
        if len(books_with_vectors) >= TARGET_BOOK_COUNT:
            break

        try:
            work_key = work.get('key')
            if not work_key:
                continue

            # --- THE DEFINITIVE FIX: Fetch Detailed Book Info for Category ---
            details_url = f"https://openlibrary.org{work_key}.json"
            details_response = requests.get(details_url, timeout=10)
            details_data = details_response.json()
            
            # Extract the first subject from the list to use as our category
            subjects = details_data.get('subjects', ['General'])
            category = subjects[0] if subjects else 'General'
            # --- END FIX ---

            cover_id = work.get('cover_i')
            title = work.get('title')
            authors = work.get('author_name', ['Unknown Author'])

            if not all([cover_id, title, authors]):
                continue

            cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
            
            # Download and validate image
            image_response = requests.get(cover_url, timeout=15)
            if image_response.status_code != 200 or len(image_response.content) < 2000:
                continue
            
            image = Image.open(BytesIO(image_response.content)).convert("RGB")
            vector = model.encode(image).tolist()

            books_with_vectors.append({
                'id': work_key.replace('/works/', ''),
                'title': title,
                'author': ", ".join(authors),
                'category': category, # Use the rich category data
                'cover_image_url': cover_url,
                'image_vector': vector
            })
            
            # Be polite to the API to avoid being rate-limited
            time.sleep(0.1)

        except (requests.exceptions.RequestException, UnidentifiedImageError, KeyError, IndexError, json.JSONDecodeError):
            continue
            
    return books_with_vectors

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    print(f"Loading AI model: {MODEL_NAME}...")
    ai_model = SentenceTransformer(MODEL_NAME)
    print("✅ Model loaded.")

    book_docs = fetch_book_list()
    
    if book_docs:
        print(f"\nFound a total of {len(book_docs)} potential books. Now processing with detailed fetch...")
        final_data = process_books(book_docs, ai_model)

        if final_data:
            print(f"\nSuccessfully processed {len(final_data)} high-quality books with categories.")
            print(f"Saving final data to '{OUTPUT_FILE}'...")
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(final_data, f, indent=2)
            print("🎉🎉🎉 All done! Your new data file is ready.")
        else:
            print("❌ Could not generate data from the fetched books. All of them failed validation.")

