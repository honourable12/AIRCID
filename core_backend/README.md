
<div align="center">
  <h1 align="center">Core Backend API</h1>
  <p align="center">
    A robust, secure, and scalable FastAPI backend for managing complex research data.
  </p>
</div>

<div align="center">

</div>

---

This document provides a comprehensive overview of the Core Backend API, a project designed to provide a solid foundation for research data management. It covers the project's architecture, features, setup, and usage.

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technical Stack](#technical-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Seeding the Database](#seeding-the-database)
  - [Running the Application](#running-the-application)
- [Usage](#usage)
  - [Interactive API Documentation](#interactive-api-documentation)
  - [Automated API Testing](#automated-api-testing)
- [Running Tests](#running-tests)
- [Configuration](#configuration)
- [Security Considerations](#security-considerations)
- [Future Improvements](#future-improvements)
- [API Endpoint Summary](#api-endpoint-summary)

## Introduction

The Core Backend API is a feature-rich application designed to address the challenges of managing data for scientific and market research studies. It provides a secure and organized way to handle everything from user authentication to data collection and export. Built with modern tools like FastAPI and PostgreSQL, the API is designed for high performance, scalability, and ease of maintenance, making it an ideal backend for a sophisticated research platform.

## Key Features

*   **Role-Based Access Control (RBAC):** Pre-configured roles (Admin, Researcher) to ensure users can only access data they are authorized to see.
*   **Comprehensive Study Management:** Full CRUD functionality for studies, forms, and questions.
*   **Flexible Participant Tracking:** Manage participants anonymously or link them to user accounts for longitudinal studies.
*   **Secure Data Handling:** End-to-end security with password hashing, JWT authentication, and validation.
*   **High-Performance Data Export:** Export study data to CSV or Apache Parquet for easy analysis in external tools.
*   **Auditing:** Middleware to log all API requests, providing a clear audit trail of activities.
*   **Asynchronous Operations:** Built on an ASGI framework (FastAPI) to handle a large number of concurrent requests efficiently.

## System Architecture

The API is built with a clean, modular architecture that promotes separation of concerns.

```
+-----------------+      +----------------------+      +-----------------+
|   Client (UI)   |----->|   FastAPI Backend    |----->|  PostgreSQL DB  |
+-----------------+      | (Uvicorn Server)     |      +-----------------+
                         |                      |
                         | +------------------+ |
                         | |   API Endpoints  | |
                         | +------------------+ |
                         | |    Dependencies  | |
                         | +------------------+ |
                         | | Pydantic Models  | |
                         | +------------------+ |
                         | |  Database Logic  | |
                         | +------------------+ |
                         +----------------------+
```

## Technical Stack

*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/)
*   **Language:** Python 3.12
*   **Dependency Management:** [Poetry](https://python-poetry.org/)
*   **Server:** [Uvicorn](https://www.uvicorn.org/)
*   **Containerization:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
*   **Testing:** [Pytest](https://pytest.org/)

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

2.  **Install dependencies using Poetry:**
    ```bash
    poetry install
    ```

### Database Setup

1.  **Start the PostgreSQL database using Docker Compose:**
    ```bash
    docker-compose up -d
    ```
    This will start a PostgreSQL instance in the background.

### Seeding the Database

To populate the database with initial data (e.g., user roles), run the seed script:

```bash
poetry run python seed.py
```

### Running the Application

1.  **Start the FastAPI application with Uvicorn:**
    ```bash
    poetry run uvicorn app.main:app --reload
    ```
The API will be available at `http://127.0.0.1:8000`.

## Usage

### Interactive API Documentation

FastAPI automatically generates interactive API documentation. Once the application is running, you can access it at:

-   **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
-   **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

These interfaces allow you to explore and test all API endpoints directly from your browser.
## Running Tests

The project uses `pytest` for unit and integration testing. To run the test suite:

```bash
poetry run pytest
```

## Configuration

The application is configured using environment variables. Create a `.env` file in the root directory with the following variables:

-   `DATABASE_URL`: The connection string for the PostgreSQL database.
-   `SECRET_KEY`: A secret key for signing JWTs.
-   `ALGORITHM`: The algorithm used for JWT encoding (e.g., `HS256`).
-   `ACCESS_TOKEN_EXPIRE_MINUTES`: The lifespan of an access token in minutes.

## Security Considerations

-   **Password Hashing:** All user passwords are securely hashed using `bcrypt` and never stored in plain text.
-   **JWT Authentication:** API endpoints are protected using JSON Web Tokens (JWT), ensuring that only authenticated users can access protected resources.
-   **Input Validation:** Pydantic models provide automatic request data validation, preventing common injection attacks.
-   **Dependency Management:** Poetry and `uv.lock` ensure that all dependencies are pinned to specific versions, mitigating the risk of vulnerabilities from upstream packages.

## Future Improvements

-   **WebSocket Support:** Implement WebSockets for real-time notifications and data updates.
-   **Admin UI:** Develop a simple front-end application for easier administration.
-   **Expanded Export Options:** Add support for more data export formats like JSON or XML.
-   **CI/CD Pipeline:** Set up a continuous integration and deployment pipeline to automate testing and deployment.
