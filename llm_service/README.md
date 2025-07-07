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
