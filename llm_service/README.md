<h1 align="center">LLM-Powered Clinical Research Assistant Microservice </h1>

This project is a high-performance FastAPI microservice that leverages large language models (LLMs) to streamline and automate key tasks for clinical researchers. By providing a comprehensive RESTful API, the service empowers users to process documents, extract insights through advanced question-answering, and generate structured content, ultimately accelerating the clinical trial workflow.

Core Functionality
The microservice provides a suite of powerful, LLM-driven features designed to support every stage of a research project.

Document Processing: Seamlessly ingest and process various document formats (PDF, TXT, images) to create a searchable knowledge base.

Retrieval-Augmented Generation (RAG) Q&A: Ask natural language questions and receive precise, context-aware answers grounded in the uploaded documents.

Criteria Augmentation: Refine and structure complex clinical trial criteria by augmenting natural language input with clearer wording and templated rules.

Dynamic Form Generation: Automatically generate JSON schema definitions for data collection forms based on high-level study objectives.

Text Summarization: Condense lengthy texts into clear, concise summaries, configurable by context and target length.

Secure Access: Ensure data integrity and secure API access with JWT-based authentication and Role-Based Access Control (RBAC).

Technical Architecture
This project is built on a modern, robust, and scalable stack, chosen for its performance, ease of use, and strong ecosystem support.

Backend: FastAPI for its high performance, async capabilities, and automatic API documentation.

LLM Orchestration: LangChain for abstracting complex LLM operations and Groq for high-speed inference.

Vector Database: ChromaDB for efficient storage and retrieval of vector embeddings.

Data Persistence: SQLAlchemy with SQLite for lightweight, reliable data storage.

Package Management: uv for fast and reproducible dependency management.

API Quickstart
Follow these steps to get the service running and interact with the API endpoints using curl. The examples below assume the service is running locally on http://127.0.0.1:8000.

1. Authentication
First, obtain a JWT token. This token is required for all secure endpoints and expires after a limited time. The roles field determines the user's permissions.

# Get a token and store it in an environment variable for easy access

```export TOKEN=$(curl -X POST "http://127.0.0.1:8000/token" \
-H "Content-Type: application/json" \
-d '''{"user_id": "testuser", "username": "Test User", "roles": ["researcher", "admin"]}''' | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
```

# Display the token to confirm it's set
echo "Token: $TOKEN"

2. Document Management (/documents)
This set of endpoints allows authenticated users (admin or researcher role) to manage documents within the system.

Upload a Document
```
curl -X POST "http://127.0.0.1:8000/documents/upload" \
-H "Authorization: Bearer $TOKEN" \
-F "file=@/path/to/your/document.pdf"
```

List All Documents
```
curl -X GET "http://127.0.0.1:8000/documents/list" \
-H "Authorization: Bearer $TOKEN"
```

3. Retrieval-Augmented Generation (/qna)
This endpoint allows users to ask questions based on the content of the uploaded documents. No authentication is required.

Ask a Question
```
curl -X POST "http://127.0.0.1:8000/qna/ask" \
-H "Content-Type: application/json" \
-d '''{
  "question": "What are the main findings of the study?",
  "num_context_chunks": 3,
  "chat_history": []
}'''
```

4. Criteria Augmentation (/criteria)
Endpoints for augmenting and refining clinical trial criteria. Requires a valid token with researcher or admin roles.

Augment New Criteria

```
curl -X POST "http://127.0.0.1:8000/criteria/augment" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '''{
  "researcher_input": "Patients must be over 18 years old and have a history of hypertension."
}'''
```

Refine Existing Criteria
# Assuming 'version_id' is the ID of an existing criteria version

```
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

````

5. Form Generation (/forms)
Endpoints for dynamically generating and refining JSON schemas for data collection forms. Requires a valid token with researcher or admin roles.

Generate a Form Schema
```
curl -X POST "http://127.0.0.1:8000/forms/generate" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '''{
  "study_objectives": "To collect patient demographics and baseline health metrics."
}'''
```

6. Text Summarization (/text)
Summarize a given block of text. No authentication is required.

Summarize a Text Block
```
curl -X POST "http://127.0.0.1:8000/text/summarize" \
-H "Content-Type: application/json" \
-d '''{
  "text_content": "This is a long text about a clinical trial...",
  "summary_context": "briefing",
  "target_length": "1 paragraph"
}'''
```