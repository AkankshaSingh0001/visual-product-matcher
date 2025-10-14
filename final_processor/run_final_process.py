import requests
import json
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from transformers import CLIPProcessor, CLIPModel # Use the core transformers library
import torch # PyTorch is needed for this model
from tqdm import tqdm
import os
import certifi

# --- SSL FIX & SETUP ---
os.environ["SSL_CERT_FILE"] = certifi.where()
# --- END SETUP ---

# --- CONFIGURATION ---
# Use the official, smaller OpenAI model
MODEL_NAME = 'openai/clip-vit-base-patch32'
TARGET_BOOK_COUNT = 200
OUTPUT_FILE = 'books_with_vectors.json'
# --- END CONFIGURATION ---

def fetch_book_data():
    """Fetches book data from the Open Library Search API."""
    print("Fetching book list from Open Library...")
    subjects = ['science', 'art', 'history', 'technology', 'fiction', 'philosophy']
    all_docs = []
    
    for subject in subjects:
        try:
            url = f"https://openlibrary.org/search.json?subject={subject}&limit=200&fields=key,title,author_name,cover_i"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            docs_with_covers = [doc for doc in data.get('docs', []) if 'cover_i' in doc]
            all_docs.extend(docs_with_covers)
            print(f"Found {len(docs_with_covers)} potential books in '{subject}'")
        except requests.exceptions.RequestException as e:
            print(f"Warning: Could not fetch subject '{subject}'. Reason: {e}")
            
    if not all_docs:
        print("\n❌ Critical Error: Failed to fetch any book data.")
        return None
        
    return all_docs

def process_books(docs, model, processor):
    """Processes books, downloads images, and generates vectors using the new model."""
    books_with_vectors = []
    
    for work in tqdm(docs, desc="Validating images and generating vectors"):
        if len(books_with_vectors) >= TARGET_BOOK_COUNT:
            break

        try:
            cover_id = work.get('cover_i')
            title = work.get('title')
            authors = work.get('author_name', ['Unknown Author'])

            if not all([cover_id, title, authors]):
                continue

            cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"

            response = requests.get(cover_url, timeout=15)
            if response.status_code != 200 or len(response.content) < 2000:
                continue
            
            image = Image.open(BytesIO(response.content)).convert("RGB")
            
            # Use the new processor and model to get the vector
            inputs = processor(images=image, return_tensors="pt")
            with torch.no_grad(): # More efficient processing
                image_features = model.get_image_features(**inputs)
            
            # Convert to a simple list for JSON
            vector = image_features[0].numpy().tolist()

            books_with_vectors.append({
                'id': work.get('key').replace('/works/', ''),
                'title': title,
                'author': ", ".join(authors),
                'category': 'General',
                'cover_image_url': cover_url,
                'image_vector': vector
            })

        except (requests.exceptions.RequestException, UnidentifiedImageError, KeyError, IndexError):
            continue
            
    return books_with_vectors

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    print(f"Loading AI model and processor: {MODEL_NAME}...")
    ai_model = CLIPModel.from_pretrained(MODEL_NAME)
    ai_processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    print("✅ Model and processor loaded.")

    book_docs = fetch_book_data()
    
    if book_docs:
        print(f"\nFound {len(book_docs)} potential books. Now processing...")
        final_data = process_books(book_docs, ai_model, ai_processor)

        if final_data:
            print(f"\nSuccessfully processed {len(final_data)} books.")
            print(f"Saving final data to '{OUTPUT_FILE}'...")
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(final_data, f, indent=2)
            print("🎉🎉🎉 All done! Your new, memory-efficient data file is ready.")
        else:
            print("❌ Could not generate data from the fetched books.")