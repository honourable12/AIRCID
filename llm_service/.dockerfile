# Use a slim Python base image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install Tesseract OCR and its development libraries
# This is crucial for pytesseract to work
RUN apt-get update && \
    apt-get install -y tesseract-ocr libtesseract-dev && \
    rm -rf /var/lib/apt/lists/*

# Install uv globally
RUN pip install uv

# Copy pyproject.toml and uv.lock (if you generate it locally) first to leverage Docker cache
COPY pyproject.toml ./
# If you have uv.lock (recommended for reproducible builds), uncomment the line below:
# COPY uv.lock ./

# Install dependencies using uv.
# --system ensures uv installs into the system site-packages, which is typical for Docker.
RUN uv pip install --system -e . --no-deps && \
    uv pip install --system fastapi uvicorn pydantic python-dotenv groq jsonschema chromadb langchain langchain-community sentence-transformers pypdf python-multipart SQLAlchemy Pillow pytesseract && \
    # Clean up uv cache to reduce image size
    rm -rf /root/.cache/uv

# Copy the rest of your application code
COPY . .

# Expose the port your FastAPI app runs on
EXPOSE 8000

# Command to run your application using Uvicorn
# --host 0.0.0.0 makes the app accessible from outside the container
# --reload is for development, remove in production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]