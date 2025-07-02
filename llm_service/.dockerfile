# Use a minimal, up-to-date base image
FROM python:3.11-slim

# Install system dependencies and update package lists
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency files first
COPY pyproject.toml ./
# COPY uv.lock ./

# Install dependencies
RUN pip install --upgrade pip uv && \
    uv pip install --system -e . --no-deps && \
    uv pip install --system fastapi uvicorn pydantic python-dotenv groq jsonschema chromadb langchain langchain-community sentence-transformers pypdf python-multipart SQLAlchemy && \
    rm -rf /root/.cache/uv

# Copy application code
COPY . .

# Expose the port your FastAPI app runs on
EXPOSE 8000

# Command to run your application using Uvicorn
# --host 0.0.0.0 makes the app accessible from outside the container
# --reload is for development, remove in production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]