Visual Book Matcher
A full-stack web application that finds visually similar book covers using AI-powered vector embeddings.
Live Demo: [YOUR DEPLOYED URL HERE] (We will add this link after we deploy the application)

(Suggestion: Take a screenshot of your finished app, upload it to a site like Imgur, and paste the direct image link here.)

About The Project
This project is a web application designed to solve a common real-world problem: "I'm looking for a book that looks like this." It allows users to upload an image of a book cover (or provide a URL) and instantly receive a ranked list of the most visually similar books from a curated collection.

The application is built with a modern, decoupled architecture, featuring a React frontend for a dynamic user experience and a powerful Python backend to handle the complex AI and image processing tasks.

Features
This application is packed with features designed to provide a rich, professional, and user-friendly experience:

Dual-Mode Image Search:

Search by uploading a local image file.

Search by pasting a direct URL to an image.

AI-Powered Similarity Matching:

Utilizes the CLIP-ViT-B-32 model to convert images into vector embeddings.

Calculates similarity using the Cosine Similarity algorithm to rank results by visual likeness.

"Find Similar" Reverse Search: A powerful discovery tool that allows users to click an icon on any book card to perform a new search using that book's cover as the query.

Book Details Card-Flip: An elegant UI feature where clicking a book card flips it over to reveal a detailed description and publication information, fetched on demand.

Advanced Filtering:

Filter by Similarity Score: A slider allows users to dynamically filter results based on the minimum match percentage.

Filter by Category: After a search, the app generates a list of category buttons, allowing for instant filtering of the results.

High-Performance Backend:

Image Proxy with Caching: A robust Python backend service that fetches and serves external images, bypassing hotlink protection. It includes a caching layer that saves images locally, making subsequent page loads almost instantaneous.

Pagination: The main book collection is loaded in batches, ensuring a fast initial page load and a smooth "Load More" experience.

Polished & Responsive UI/UX:

Clean, modern, and professional dark-mode design with a professional font (Inter).

Component-Based Architecture: Built with a clean React structure for maintainability and scalability.

Skeleton Loaders: Shimmering placeholders are shown while data is being fetched, providing a superior user experience.

Helpful "Empty States": Clear messages are shown when a search or filter combination yields no results.

Fully responsive design that looks great on desktop, tablet, and mobile devices.

Tech Stack
This project uses a modern, decoupled stack, choosing the best tool for each job:

Frontend:

React: For building a dynamic, component-based user interface.

Vite: As the development server and build tool.

CSS: For styling with a professional dark-mode theme.

Backend:

Python: The ideal language for AI and data processing.

Flask: A lightweight web framework for building the API.

Sentence-Transformers: A powerful library for running the CLIP model locally.

Pillow (PIL): For robust image processing.

Problem-Solving Approach
A major part of this project involved overcoming the challenges of working with real-world, often unreliable, data and APIs.

The initial approach of using free-tier external AI APIs (like Replicate and Hugging Face) and data sources (Google Books API) proved to be a dead end due to retired model versions, restrictive rate limits, network instability, and poor data quality.

The definitive solution was to build a more robust, self-contained system:

Data Source: We switched to the Open Library API, which provided cleaner data and was more friendly to automated scripts. A two-step data generation script was written in Python to first find books with valid covers and then make a second, detailed request for each book to get rich category information.

AI Processing: To eliminate external dependencies and ensure reliability, the Sentence-Transformers library was used to run the AI model locally on the backend server.

Image Loading: To bypass "hotlink protection" from external image servers, a caching image proxy was built into the Python backend. This ensures all images are displayed correctly and provides a massive performance boost on subsequent loads.

This iterative, problem-solving approach resulted in a final application that is not only functional but also fast, reliable, and resilient.

How to Run Locally
To run this project on your own machine, you will need to have Node.js and Python installed.

1. Clone the repository:

git clone [https://github.com/AkankshaSingh0001/visual-product-matcher.git](https://github.com/AkankshaSingh0001/visual-product-matcher.git)
cd visual-product-matcher

2. Set up and run the Python Backend:

# Navigate to the backend folder

cd python-backend

# Install dependencies

# (You will need to create a requirements.txt file for this to work)

pip install Flask Flask-Cors sentence-transformers Pillow requests numpy certifi

# Run the server

python server.py

3. Set up and run the React Frontend:

# Open a new, second terminal

# Navigate to the frontend folder

cd frontend

# Install dependencies

npm install

# Run the development server

npm run dev
