# Use a slim Python base image matching the project's version
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Install Tesseract OCR for pytesseract dependency
RUN apt-get update && \
    apt-get install -y tesseract-ocr libtesseract-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency definition files
COPY pyproject.toml ./

# Install dependencies using pip with a longer timeout
RUN pip install --no-cache-dir --timeout 100 -e . 

# Copy the rest of the application code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]