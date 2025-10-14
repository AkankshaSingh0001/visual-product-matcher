# Use lightweight Python image
FROM python:3.10-slim

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set workdir
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Expose port (Cloud Run uses $PORT)
ENV PORT=8080
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 server:app
