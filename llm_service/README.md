# LLM Microservice

This project is a FastAPI-based microservice designed to assist clinical researchers with a variety of tasks by leveraging the power of large language models (LLMs). The service provides a RESTful API for document processing, question answering (Q&A) with Retrieval-Augmented Generation (RAG), and LLM-driven content generation and refinement.

## Core Features

- **Document Processing**: Upload and process various document formats (PDF, TXT, images) for information extraction and storage.
- **Q&A with RAG**: Ask questions in natural language and receive answers based on the content of the uploaded documents.
- **Criteria Augmentation**: Augment clinical trial criteria with clearer wording and structured rule templates.
- **Form Generation**: Generate JSON schema definitions for dynamic data collection forms based on study objectives.
- **Text Summarization**: Summarize long blocks of text into concise, easy-to-read summaries.
- **Role-Based Access Control (RBAC)**: Secure endpoints with JWT-based authentication and role-based access control.

## Tech Stack

- **Backend**: FastAPI, Python 3.12
- **LLM Integration**: LangChain, Groq
- **Vector Database**: ChromaDB
- **Data Persistence**: SQLAlchemy, SQLite
- **Package Management**: uv

## API Documentation

This section provides examples of how to use the API with `curl`.

### Authentication

First, obtain a JWT token. This token is required for most endpoints. The token is valid for a limited time (default is 30 minutes). You can generate a token with different roles, e.g., "researcher" or "admin".

To get a token and store it in an environment variable:

```bash
export TOKEN=$(curl -X POST "http://127.0.0.1:8000/token" -H "Content-Type: application/json" -d '''{"user_id": "testuser", "username": "Test User", "roles": ["researcher", "admin"]}''' | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
echo "Token: $TOKEN"
```

### Documents API (`/documents`)

#### Upload a document
*Requires `admin` or `researcher` role.*
```bash
curl -X POST "http://127.0.0.1:8000/documents/upload" \
-H "Authorization: Bearer $TOKEN" \
-F "file=@/path/to/your/document.pdf"
```

#### List all uploaded documents
*Requires `admin` or `researcher` role.*
```bash
curl -X GET "http://127.0.0.1:8000/documents/list" \
-H "Authorization: Bearer $TOKEN"
```

#### Get a specific document by ID
*Requires `admin` or `researcher` role.*
```bash
curl -X GET "http://127.0.0.1:8000/documents/{document_id}" \
-H "Authorization: Bearer $TOKEN"
```

#### Delete a document by ID
*Requires `admin` or `researcher` role.*
```bash
curl -X DELETE "http://127.0.0.1:8000/documents/{document_id}" \
-H "Authorization: Bearer $TOKEN"
```

### Q&A API (`/qna`)

#### Ask a question (RAG)
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

### Criteria Augmentation API (`/criteria`)

#### Augment clinical trial criteria
*Requires `researcher` or `admin` role.*
```bash
curl -X POST "http://127.0.0.1:8000/criteria/augment" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '''{
  "researcher_input": "Patients must be over 18 years old and have a history of hypertension."
}'''
```

#### Refine an existing criteria version
*Requires `researcher` or `admin` role.*
```bash
curl -X POST "http://127.0.0.1:8000/criteria/versions/{version_id}/refine" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '''{
  "refined_output": {
    "clearer_wording": "Participants must be 18 years of age or older with a documented medical history of hypertension.",
    "suggested_rules": [
      "age >= 18",
      "condition = 'hypertension'"
    ]
  }
}'''
```

#### Get a specific criteria version by ID
*Requires `researcher` or `admin` role.*
```bash
curl -X GET "http://127.0.0.1:8000/criteria/versions/{version_id}" \
-H "Authorization: Bearer $TOKEN"
```

#### Get all criteria versions for a given input hash
*Requires `researcher` or `admin` role.*
```bash
curl -X GET "http://127.0.0.1:8000/criteria/history/by_input_hash/{input_hash}" \
-H "Authorization: Bearer $TOKEN"
```

#### Get the latest criteria version for each unique input
*Requires `researcher` or `admin` role.*
```bash
curl -X GET "http://127.0.0.1:8000/criteria/versions/latest" \
-H "Authorization: Bearer $TOKEN"
```

### Form Generation API (`/forms`)

#### Generate a form schema
*Requires `researcher` or `admin` role.*
```bash
curl -X POST "http://127.0.0.1:8000/forms/generate" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '''{
  "study_objectives": "To collect patient demographics and baseline health metrics."
}'''
```

#### Refine an existing form version
*Requires `researcher` or `admin` role.*
```bash
curl -X POST "http://127.0.0.1:8000/forms/versions/{version_id}/refine" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '''{
  "refined_output": {
    "title": "Patient Intake Form",
    "type": "object",
    "properties": {
      "full_name": {"type": "string"},
      "age": {"type": "number"},
      "is_smoker": {"type": "boolean"}
    }
  }
}'''
```

#### Get a specific form version by ID
*Requires `researcher` or `admin` role.*
```bash
curl -X GET "http://127.0.0.1:8000/forms/versions/{version_id}" \
-H "Authorization: Bearer $TOKEN"
```

#### Get all form versions for a given input hash
*Requires `researcher` or `admin` role.*
```bash
curl -X GET "http://127.0.0.1:8000/forms/history/by_input_hash/{input_hash}" \
-H "Authorization: Bearer $TOKEN"
```

#### Get the latest form version for each unique input
*Requires `researcher` or `admin` role.*
```bash
curl -X GET "http://127.0.0.1:8000/forms/versions/latest" \
-H "Authorization: Bearer $TOKEN"
```

### Text Summarization API (`/text`)

#### Summarize a block of text
```bash
curl -X POST "http://127.0.0.1:8000/text/summarize" \
-H "Content-Type: application/json" \
-d '''{
  "text_content": "This is a long text about a clinical trial...",
  "summary_context": "briefing",
  "target_length": "1 paragraph"
}'''
```