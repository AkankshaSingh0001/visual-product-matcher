import json
import requests
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import numpy as np
import os
import certifi
import hashlib

# --- SETUP ---
os.environ["SSL_CERT_FILE"] = certifi.where()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'image_cache')
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# --- NEW: HUGGING FACE API CONFIG ---
# The AI model is now an external API call, making our server lightweight
MODEL_API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/clip-ViT-B-32"
# The Hugging Face token will be read from an environment variable for security
HF_TOKEN = os.environ.get("HF_TOKEN")
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}
# --- END NEW CONFIG ---
# --- END SETUP ---

# --- LOAD DATA (No AI model to load here anymore) ---
print("Loading book data...")
with open('books_with_vectors.json', 'r', encoding='utf-8') as f:
    books_data = json.load(f)
books_by_id = {book['id']: book for book in books_data}
print(f"✅ Successfully loaded {len(books_data)} books.")
# --- END LOADING ---

# --- HELPER FUNCTIONS ---
def cosine_similarity(vec_a, vec_b):
    vec_a = np.array(vec_a)
    vec_b = np.array(vec_b)
    dot_product = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0: return 0
    return dot_product / (norm_a * norm_b)

def get_vector_from_hf(image_bytes):
    """Calls the Hugging Face Inference API to get an image vector."""
    response = requests.post(MODEL_API_URL, headers=HEADERS, data=image_bytes)
    if response.status_code != 200:
        raise Exception(f"Hugging Face API Error: {response.text}")
    return response.json()
# --- END HELPERS ---

# --- API ROUTES ---
@app.route('/api/books', methods=['GET'])
def get_books():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 24, type=int)
    start_index = (page - 1) * limit
    end_index = start_index + limit
    paginated_books = books_data[start_index:end_index]
    return jsonify({'books': paginated_books, 'total': len(books_data)})

@app.route('/api/image-proxy')
def image_proxy():
    image_url = request.args.get('url')
    if not image_url: return 'Missing URL parameter', 400
    filename = hashlib.md5(image_url.encode()).hexdigest()
    cached_path = os.path.join(CACHE_DIR, filename)
    if os.path.exists(cached_path):
        return send_file(cached_path)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(image_url, headers=headers, stream=True, timeout=15)
        response.raise_for_status()
        image_content = response.content
        with open(cached_path, 'wb') as f: f.write(image_content)
        return send_file(BytesIO(image_content), mimetype=response.headers.get('Content-Type'))
    except requests.exceptions.RequestException:
        return 'Failed to fetch image', 500

@app.route('/api/book-details/<book_id>', methods=['GET'])
def get_book_details(book_id):
    try:
        details_url = f"https://openlibrary.org/works/{book_id}.json"
        response = requests.get(details_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        description = "No description available."
        desc_data = data.get('description')
        if desc_data:
            if isinstance(desc_data, dict): description = desc_data.get('value', description)
            else: description = str(desc_data)
        publish_date = data.get('first_publish_date', 'N/A')
        return jsonify({'description': description, 'publish_date': publish_date, 'open_library_link': f"https://openlibrary.org{data.get('key')}"})
    except requests.exceptions.RequestException:
        return jsonify({'error': 'Failed to fetch book details.'}), 500

@app.route('/api/search', methods=['POST'])
def search():
    image_bytes = None
    if 'image' in request.files and request.files['image'].filename != '':
        file = request.files['image']
        image_bytes = file.read()
    else:
        json_data = request.get_json(silent=True)
        if json_data and 'imageUrl' in json_data:
            image_url = json_data['imageUrl']
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                response = requests.get(image_url, headers=headers)
                response.raise_for_status()
                content_type = response.headers.get('content-type')
                if not content_type or 'image' not in content_type:
                    return jsonify({'error': 'URL is not a direct link to an image.'}), 400
                image_bytes = response.content
            except Exception as e:
                return jsonify({'error': f'Could not fetch image from URL: {e}'}), 400
                
    if image_bytes is None: return jsonify({'error': 'No valid image provided.'}), 400

    try:
        # Call the external API for the vector
        query_vector = get_vector_from_hf(image_bytes)
        results = [{**book, 'similarity': cosine_similarity(query_vector, book['image_vector'])} for book in books_data]
        results.sort(key=lambda x: x['similarity'], reverse=True)
        top_10_results = results[:10]
        return jsonify(top_10_results)
    except Exception as e:
        print(f"Error during AI processing: {e}")
        return jsonify({'error': 'Error during AI processing.'}), 500

@app.route('/api/search-by-id', methods=['POST'])
def search_by_id():
    json_data = request.get_json()
    if not json_data or 'id' not in json_data:
        return jsonify({'error': 'Book ID missing.'}), 400
    book_id = json_data['id']
    source_book = books_by_id.get(book_id)
    if not source_book:
        return jsonify({'error': 'Book not found.'}), 404
    try:
        query_vector = source_book['image_vector']
        results = []
        for book in books_data:
            if book['id'] == book_id: continue
            similarity = cosine_similarity(query_vector, book['image_vector'])
            results.append({**book, 'similarity': similarity})
        results.sort(key=lambda x: x['similarity'], reverse=True)
        final_results = [source_book] + results[:9]
        return jsonify(final_results)
    except Exception as e:
        return jsonify({'error': 'Error during similarity search.'}), 500

if __name__ == '__main__':
    if not HF_TOKEN:
        print("WARNING: HF_TOKEN environment variable not set. This is required for deployment.")
    app.run(port=5001)

