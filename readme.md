# Clinical Trial and Research Platform

This project is a comprehensive, multi-service platform designed to streamline clinical trial management, patient-study matching, and research data analysis through a modern web interface and powerful AI-driven features.

## Design and Architecture

The platform is built on a **microservices architecture**, which separates concerns into independent, scalable, and maintainable services. This design ensures that different functionalities of the application are decoupled, allowing for independent development, deployment, and scaling.

The primary components are:
1.  **Frontend Application**: The user-facing web interface.
2.  **Core Backend Service**: The central hub for business logic and data management.
3.  **LLM Service**: A dedicated service for all Large Language Model (LLM) and AI-powered features.
4.  **Patient Matching Service**: A specialized microservice for matching patients with relevant clinical studies.

---

## Component Breakdown

### 1. Frontend (`/frontend`)

The frontend is a modern, responsive web application that serves as the primary user interface for the entire platform.

- **Technology**: Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), and [TypeScript](https://www.typescriptlang.org/), styled with [Tailwind CSS](https://tailwindcss.com/).
- **Key Features**:
    - User authentication (Login/Register).
    - A dashboard for creating, viewing, and managing studies and forms.
    - An interface for participants to complete surveys and submit responses.
    - An AI-powered chat interface for interacting with study documents.
    - Tools for summarizing notes and other text-based data.

### 2. Core Backend (`/core_backend`)

This service is the backbone of the application, handling core business logic, user management, and data persistence.

- **Technology**: A [Python](https://www.python.org/) backend built with the [FastAPI](https://fastapi.tiangolo.com/) framework.
- **Responsibilities**:
    - Manages all core data models: `User`, `Study`, `Form`, `Question`, `Participant`, `Role`, etc.
    - Handles user authentication and authorization logic.
    - Provides a robust REST API for the frontend to consume, managing all CRUD (Create, Read, Update, Delete) operations for the core platform data.
    - See `core_backend/API_DOCUMENTATION.md` for detailed endpoint information.

### 3. LLM Service (`/llm_service`)

This service centralizes all AI and Natural Language Processing (NLP) capabilities, providing intelligence to the platform.

- **Technology**: A [Python](https://www.python.org/) service (likely using FastAPI or Flask) integrated with a **ChromaDB** vector database.
- **Responsibilities**:
    - **Retrieval-Augmented Generation (RAG)**: Manages the ingestion of documents, creates vector embeddings, and stores them in ChromaDB.
    - **Q&A Functionality**: Provides an API endpoint that allows users to "chat" with their documents by answering natural language questions.
    - **Text Summarization**: Offers endpoints for summarizing long-form text, such as patient notes or research papers.
    - See `llm_service/API_DOCUMENTATION.md` for detailed endpoint information.

### 4. Patient Matching Service (`/python_microservices`)

This is a specialized microservice designed to intelligently match patients with suitable clinical studies based on complex criteria.

- **Technology**: A [Python](https://www.python.org/) service.
- **Responsibilities**:
    - Processes patient data and clinical study eligibility criteria.
    - Utilizes NLP and business logic to determine and score potential matches.
    - Exposes an API endpoint that the frontend or other services can use to retrieve a list of eligible studies for a given patient.
    - See `python_microservices/API_DOCUMENTATION.md` for detailed endpoint information.
