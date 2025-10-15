# Use an official, lightweight Python image as a starting point
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application's code into the container
COPY . .

# Tell Google Cloud what port the application will run on
EXPOSE 8080

# The command to run your application using Gunicorn
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:8080"]
```

### Step 2: Push the `Dockerfile` to GitHub

Now that you've added this new file, you must save it to your GitHub repository so Google Cloud can see it.

1.  Open your terminal at the root of your project.
2.  Run these commands:
    ```bash
    git add .
    git commit -m "Feat: Add Dockerfile for Google Cloud deployment"
    git push
    
