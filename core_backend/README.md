# Core Backend API

This document provides a comprehensive overview of the Core Backend API, including its purpose, setup instructions, and detailed endpoint documentation.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Studies](#studies)
  - [Forms](#forms)
  - [Questions](#questions)
  - [Participants](#participants)
  - [Responses](#responses)
  - [Data Export](#data-export)

## Project Overview

The Core Backend API is a FastAPI-based application designed to manage research studies. It provides a comprehensive set of endpoints for managing users, studies, forms, questions, participants, and their responses. The API also includes features for data export in CSV and Parquet formats.

## Getting Started

### Prerequisites

- Python 3.12
- Poetry
- Docker

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd core_backend
    ```

2.  **Install dependencies:**

    ```bash
    poetry install
    ```

3.  **Set up the environment:**

    Create a `.env` file in the root directory and add the following variables:

    ```
    DATABASE_URL=postgresql+asyncpg://user:password@db:5432/mydatabase
    SECRET_KEY=your-secret-key
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

### Running the Application

1.  **Start the database:**

    ```bash
    docker-compose up -d
    ```

2.  **Run the application:**

    ```bash
    poetry run uvicorn app.main:app --reload
    ```

The API will be available at `http://127.0.0.1:8000`.

## API Documentation

### Authentication

#### `POST /api/v1/auth/token`

-   **Summary:** Authenticate user and get access token.
-   **Request Body:** `OAuth2PasswordRequestForm`
-   **Responses:**
    -   `200 OK`: Returns a `Token` object with the access token.
    -   `401 Unauthorized`: Incorrect username or password.

#### `POST /api/v1/auth/register`

-   **Summary:** Register a new user.
-   **Request Body:** `UserRegister`
-   **Responses:**
    -   `201 Created`: Returns the newly created `UserRead` object.
    -   `400 Bad Request`: Email already registered.
    -   `500 Internal Server Error`: Researcher role not found.

### Users

#### `POST /api/v1/users/`

-   **Summary:** Create a new user (Admin only).
-   **Request Body:** `UserCreate`
-   **Responses:**
    -   `201 Created`: Returns the newly created `UserRead` object.
    -   `400 Bad Request`: Email already registered.
    -   `500 Internal Server Error`: Participant role not found.

#### `GET /api/v1/users/`

-   **Summary:** Get all users (Admin only).
-   **Responses:**
    -   `200 OK`: Returns a list of `UserRead` objects.

#### `GET /api/v1/users/me`

-   **Summary:** Get current user's profile.
-   **Responses:**
    -   `200 OK`: Returns the `UserRead` object for the current user.

#### `GET /api/v1/users/{user_id}`

-   **Summary:** Get a user by ID (Admin only).
-   **Responses:**
    -   `200 OK`: Returns the `UserRead` object.
    -   `404 Not Found`: User not found.

#### `PUT /api/v1/users/{user_id}`

-   **Summary:** Update a user by ID (Admin only).
-   **Request Body:** `UserUpdate`
-   **Responses:**
    -   `200 OK`: Returns the updated `UserRead` object.
    -   `404 Not Found`: User not found.

#### `DELETE /api/v1/users/{user_id}`

-   **Summary:** Delete a user by ID (Admin only).
-   **Responses:**
    -   `204 No Content`: User deleted successfully.
    -   `404 Not Found`: User not found.

### Studies

#### `POST /api/v1/studies/`

-   **Summary:** Create a new study.
-   **Request Body:** `StudyCreate`
-   **Responses:**
    -   `201 Created`: Returns the newly created `StudyRead` object.

#### `GET /api/v1/studies/`

-   **Summary:** Get all studies.
-   **Responses:**
    -   `200 OK`: Returns a list of `StudyRead` objects.

#### `GET /api/v1/studies/{study_id}`

-   **Summary:** Get a study by ID.
-   **Responses:**
    -   `200 OK`: Returns the `StudyRead` object.
    -   `404 Not Found`: Study not found.
    -   `403 Forbidden`: Not authorized to view this study.

#### `PUT /api/v1/studies/{study_id}`

-   **Summary:** Update an existing study.
-   **Request Body:** `StudyUpdate`
-   **Responses:**
    -   `200 OK`: Returns the updated `StudyRead` object.
    -   `404 Not Found`: Study not found.
    -   `403 Forbidden`: Not authorized to update this study.

#### `DELETE /api/v1/studies/{study_id}`

-   **Summary:** Delete a study.
-   **Responses:**
    -   `204 No Content`: Study deleted successfully.
    -   `404 Not Found`: Study not found.
    -   `403 Forbidden`: Not authorized to delete this study.

### Forms

#### `POST /api/v1/forms/`

-   **Summary:** Create a new form for a study.
-   **Request Body:** `FormCreate`
-   **Responses:**
    -   `201 Created`: Returns the newly created `FormRead` object.
    -   `404 Not Found`: Study not found.

#### `GET /api/v1/forms/by_study/{study_id}`

-   **Summary:** Get forms for a specific study.
-   **Responses:**
    -   `200 OK`: Returns a list of `FormRead` objects.
    -   `404 Not Found`: Study not found.

#### `GET /api/v1/forms/{form_id}`

-   **Summary:** Get a form by ID.
-   **Responses:**
    -   `200 OK`: Returns the `FormRead` object.
    -   `404 Not Found`: Form not found.

#### `PUT /api/v1/forms/{form_id}`

-   **Summary:** Update a form by ID.
-   **Request Body:** `FormUpdate`
-   **Responses:**
    -   `200 OK`: Returns the updated `FormRead` object.
    -   `404 Not Found`: Form not found.

#### `DELETE /api/v1/forms/{form_id}`

-   **Summary:** Delete a form by ID.
-   **Responses:**
    -   `204 No Content`: Form deleted successfully.
    -   `404 Not Found`: Form not found.

### Questions

#### `POST /api/v1/questions/`

-   **Summary:** Create a new question for a form.
-   **Request Body:** `QuestionCreate`
-   **Responses:**
    -   `201 Created`: Returns the newly created `QuestionRead` object.
    -   `404 Not Found`: Form not found.

#### `GET /api/v1/questions/`

-   **Summary:** Get all questions or filter by form ID.
-   **Query Parameters:**
    -   `form_id` (optional): Filter questions by form ID.
-   **Responses:**
    -   `200 OK`: Returns a list of `QuestionRead` objects.
    -   `403 Forbidden`: Not authorized to view questions.

#### `GET /api/v1/questions/{question_id}`

-   **Summary:** Get a question by ID.
-   **Responses:**
    -   `200 OK`: Returns the `QuestionRead` object.
    -   `404 Not Found`: Question not found.

#### `PUT /api/v1/questions/{question_id}`

-   **Summary:** Update an existing question.
-   **Request Body:** `QuestionUpdate`
-   **Responses:**
    -   `200 OK`: Returns the updated `QuestionRead` object.
    -   `404 Not Found`: Question not found.

#### `DELETE /api/v1/questions/{question_id}`

-   **Summary:** Delete a question.
-   **Responses:**
    -   `204 No Content`: Question deleted successfully.
    -   `404 Not Found`: Question not found.

### Participants

#### `POST /api/v1/participants/`

-   **Summary:** Register a new participant (anonymous or linked to user).
-   **Request Body:** `ParticipantCreate`
-   **Responses:**
    -   `201 Created`: Returns the newly created `ParticipantRead` object.
    -   `404 Not Found`: User specified for participant not found.

#### `GET /api/v1/participants/`

-   **Summary:** Get all participants (Admin) or those researcher has access to.
-   **Query Parameters:**
    -   `user_id` (optional): Filter participants by user ID.
-   **Responses:**
    -   `200 OK`: Returns a list of `ParticipantRead` objects.
    -   `403 Forbidden`: Not authorized to view participants.

#### `GET /api/v1/participants/{participant_id}`

-   **Summary:** Get a participant by ID.
-   **Responses:**
    -   `200 OK`: Returns the `ParticipantRead` object.
    -   `404 Not Found`: Participant not found.

#### `PUT /api/v1/participants/{participant_id}`

-   **Summary:** Update an existing participant.
-   **Request Body:** `ParticipantUpdate`
-   **Responses:**
    -   `200 OK`: Returns the updated `ParticipantRead` object.
    -   `404 Not Found`: Participant not found or new user specified for participant not found.

#### `DELETE /api/v1/participants/{participant_id}`

-   **Summary:** Delete a participant.
-   **Responses:**
    -   `204 No Content`: Participant deleted successfully.
    -   `404 Not Found`: Participant not found.

### Responses

#### `POST /api/v1/responses/`

-   **Summary:** Submit a participant's response to a question.
-   **Request Body:** `ResponseCreate`
-   **Responses:**
    -   `201 Created`: Returns the newly created `ResponseRead` object.
    -   `404 Not Found`: Question or participant not found.

#### `GET /api/v1/responses/`

-   **Summary:** Get all responses (Admin/Researcher) or responses for specific forms/participants.
-   **Query Parameters:**
    -   `question_id` (optional): Filter responses by question ID.
    -   `participant_id` (optional): Filter responses by participant ID.
-   **Responses:**
    -   `200 OK`: Returns a list of `ResponseRead` objects.
    -   `403 Forbidden`: Not authorized to view responses.

#### `GET /api/v1/responses/{response_id}`

-   **Summary:** Get a response by ID.
-   **Responses:**
    -   `200 OK`: Returns the `ResponseRead` object.
    -   `404 Not Found`: Response not found.

#### `PUT /api/v1/responses/{response_id}`

-   **Summary:** Update an existing response.
-   **Request Body:** `ResponseUpdate`
-   **Responses:**
    -   `200 OK`: Returns the updated `ResponseRead` object.
    -   `404 Not Found`: Response not found.

#### `DELETE /api/v1/responses/{response_id}`

-   **Summary:** Delete a response.
-   **Responses:**
    -   `204 No Content`: Response deleted successfully.
    -   `404 Not Found`: Response not found.

### Data Export

#### `GET /api/v1/export/studies/csv`

-   **Summary:** Export all studies data as CSV.
-   **Responses:**
    -   `200 OK`: Returns a CSV file with all studies data.
    -   `404 Not Found`: No studies found to export.

#### `GET /api/v1/export/studies/parquet`

-   **Summary:** Export all studies data as Parquet.
-   **Responses:**
    -   `200 OK`: Returns a Parquet file with all studies data.
    -   `404 Not Found`: No studies found to export.
