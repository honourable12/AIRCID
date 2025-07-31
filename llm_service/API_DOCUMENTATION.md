# LLM Microservice API Documentation

This document provides detailed documentation for the LLM Microservice API. The service is designed to assist clinical researchers with a variety of tasks by leveraging the power of large language models (LLMs).

## Authentication

Most endpoints in this API are protected and require a JSON Web Token (JWT) for authentication. To access these endpoints, you must first obtain a token and then include it in the `Authorization` header of your requests as a Bearer token.

### Obtain a JWT Token

To obtain a token, you can send a POST request to the `/token` endpoint. You can specify the `user_id`, `username`, and `roles` in the request body to generate a token with the desired permissions.

**Endpoint:** `POST /token`

**Request Body:**

```json
{
  "user_id": "testuser",
  "username": "Test User",
  "roles": ["researcher", "admin"]
}
```

**Example `curl` command:**

```bash
export TOKEN=$(curl -X POST "http://127.0.0.1:8000/token" -H "Content-Type: application/json" -d '''{"user_id": "testuser", "username": "Test User", "roles": ["researcher", "admin"]}''' | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
echo "Token: $TOKEN"
```

---

## Documents API

The Documents API provides endpoints for managing documents within the system.

### Upload a document

Upload a document (PDF, TXT, or image) for processing and indexing.

- **Endpoint:** `POST /documents/upload`
- **Authorization:** `admin` or `researcher`
- **Request:** `multipart/form-data` with a `file` field containing the document.
- **Response:**
    - `200 OK`: If the document is uploaded and indexed successfully.
    - `400 Bad Request`: If the file type is unsupported or the content is empty.
    - `500 Internal Server Error`: If an error occurs during processing.

**Example `curl` command:**

```bash
curl -X POST "http://127.0.0.1:8000/documents/upload" \
-H "Authorization: Bearer $TOKEN" \
-F "file=@/path/to/your/document.pdf"
```

### List all uploaded documents

Retrieve a list of all documents that have been uploaded.

- **Endpoint:** `GET /documents/list`
- **Authorization:** `admin` or `researcher`
- **Response:** A JSON array of document objects.

**Example `curl` command:**

```bash
curl -X GET "http://127.0.0.1:8000/documents/list" \
-H "Authorization: Bearer $TOKEN"
```

### Get a specific document by ID

Retrieve a single document by its unique ID.

- **Endpoint:** `GET /documents/{document_id}`
- **Authorization:** `admin` or `researcher`
- **Response:** A JSON object containing the document's details.

**Example `curl` command:**

```bash
curl -X GET "http://127.0.0.1:8000/documents/{document_id}" \
-H "Authorization: Bearer $TOKEN"
```

### Delete a document by ID

Delete a document from the database and the vector store.

- **Endpoint:** `DELETE /documents/{document_id}`
- **Authorization:** `admin` or `researcher`
- **Response:**
    - `200 OK`: If the document is deleted successfully.
    - `404 Not Found`: If the document does not exist.

**Example `curl` command:**

```bash
curl -X DELETE "http://127.0.0.1:8000/documents/{document_id}" \
-H "Authorization: Bearer $TOKEN"
```

---

## Q&A API

The Q&A API allows you to ask questions and get answers based on the knowledge base of uploaded documents.

### Ask a question (RAG)

Ask a question and receive an answer generated using the Retrieval-Augmented Generation (RAG) model.

- **Endpoint:** `POST /qna/ask`
- **Request Body:**

```json
{
  "question": "What are the main findings of the study?",
  "num_context_chunks": 3,
  "chat_history": [
    {"role": "user", "content": "Tell me about the clinical trial."},
    {"role": "assistant", "content": "It is a study on the effects of a new drug."}
  ]
}
```

- **Response:** A JSON object containing the answer, sources, and other details.

**Example `curl` command:**

```bash
curl -X POST "http://127.0.0.1:8000/qna/ask" \
-H "Content-Type: application/json" \
-d '''{
  "question": "What are the main findings of the study?",
  "num_context_chunks": 3,
  "chat_history": [
    {"role": "user", "content": "Tell me about the clinical trial."},
    {"role": "assistant", "content": "It is a study on the effects of a new drug."}
  ]
}'''
```

---

## Criteria Augmentation API

This API helps augment and manage clinical trial criteria.

### Augment clinical trial criteria

- **Endpoint:** `POST /criteria/augment`
- **Authorization:** `researcher` or `admin`
- **Request Body:**

```json
{
  "researcher_input": "Patients must be over 18 years old and have a history of hypertension."
}
```

- **Response:** A JSON object with clearer wording, suggested rules, and versioning information.

### Refine an existing criteria version

- **Endpoint:** `POST /criteria/versions/{version_id}/refine`
- **Authorization:** `researcher` or `admin`
- **Request Body:**

```json
{
  "refined_output": {
    "clearer_wording": "Participants must be 18 years of age or older with a documented medical history of hypertension.",
    "suggested_rules": [
      {"description": "Age must be greater than or equal to 18", "structured_format": "age >= 18"},
      {"description": "Condition must be hypertension", "structured_format": "condition = 'hypertension'"}
    ]
  }
}
```

- **Response:** The refined criteria object with updated versioning.

### Get a specific criteria version by ID

- **Endpoint:** `GET /criteria/versions/{version_id}`
- **Authorization:** `researcher` or `admin`
- **Response:** The details of the specified criteria version.

### Get all criteria versions for a given input hash

- **Endpoint:** `GET /criteria/history/by_input_hash/{input_hash}`
- **Authorization:** `researcher` or `admin`
- **Response:** A list of all versions for a given input hash.

### Get the latest criteria version for each unique input

- **Endpoint:** `GET /criteria/versions/latest`
- **Authorization:** `researcher` or `admin`
- **Response:** A list of the latest versions for each unique input.

---

## Form Generation API

This API assists in generating and managing JSON schemas for forms.

### Generate a form schema

- **Endpoint:** `POST /forms/generate`
- **Authorization:** `researcher` or `admin`
- **Request Body:**

```json
{
  "study_objectives": "To collect patient demographics and baseline health metrics."
}
```

- **Response:** A JSON object containing the generated JSON schema and versioning information.

### Refine an existing form version

- **Endpoint:** `POST /forms/versions/{version_id}/refine`
- **Authorization:** `researcher` or `admin`
- **Request Body:**

```json
{
  "refined_output": {
    "title": "Patient Intake Form",
    "type": "object",
    "properties": {
      "full_name": {"type": "string"},
      "age": {"type": "number"},
      "is_smoker": {"type": "boolean"}
    }
  }
}
```

- **Response:** The refined form schema with updated versioning.

### Get a specific form version by ID

- **Endpoint:** `GET /forms/versions/{version_id}`
- **Authorization:** `researcher` or `admin`
- **Response:** The details of the specified form version.

### Get all form versions for a given input hash

- **Endpoint:** `GET /forms/history/by_input_hash/{input_hash}`
- **Authorization:** `researcher` or `admin`
- **Response:** A list of all versions for a given input hash.

### Get the latest form version for each unique input

- **Endpoint:** `GET /forms/versions/latest`
- **Authorization:** `researcher` or `admin`
- **Response:** A list of the latest versions for each unique input.

---

## Text Summarization API

The Text Summarization API provides an endpoint for summarizing long blocks of text.

### Summarize a block of text

- **Endpoint:** `POST /text/summarize`
- **Request Body:**

```json
{
  "text_content": "This is a long text about a clinical trial...",
  "summary_context": "briefing",
  "target_length": "1 paragraph"
}
```

- **Response:** A JSON object containing the summary.
