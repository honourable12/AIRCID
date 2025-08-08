# AIRCID: AI-Powered Research & Clinical Insights Dashboard

This document provides a comprehensive overview of the AIRCID frontend application, detailing its architecture, design principles, and core functionalities.

## Table of Contents

- [Introduction](#introduction)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Design & UI Philosophy](#design--ui-philosophy)
- [Getting Started](#getting-started)

## Introduction

AIRCID is a modern web application designed to streamline the process of conducting clinical and medical research. It provides a robust platform for creating and managing studies, designing data collection forms, managing participants, and leveraging the power of Generative AI for data analysis, document interaction, and form generation.

The frontend is built as a responsive, secure, and intuitive single-page application (SPA) that communicates with a separate backend for data persistence and business logic.

## Core Features

- **Authentication**: Secure user registration and login system with JWT-based session management.
- **Role-Based Access Control**: Differentiates between `participant`, `researcher`, and `administrator` roles, tailoring the UI and permissions accordingly.
- **Study Management**: A centralized dashboard for researchers and admins to create, view, update, and manage research studies.
- **Dynamic Form Builder**: An interactive UI for creating custom data collection forms with various question types (text, multiple-choice, checkboxes, etc.).
- **AI-Powered Form Generation**: Leverages a Large Language Model (LLM) to automatically generate comprehensive forms from a simple natural language prompt, accelerating study setup.
- **Participant & Survey Management**: Tools to add anonymous participants and generate unique or generic links for survey distribution.
- **Data Export**: Functionality for authorized users (researchers and admins) to export study and response data in both **CSV** and **Parquet** formats for external analysis.
- **AI Chat**: An interactive chat interface allowing users to ask questions and get answers from an LLM that has been contextualized with uploaded research documents.
- **AI Text Summarization**: An LLM-powered tool to generate concise summaries of large blocks of text, such as clinical notes.
- **User Administration**: A dedicated section for administrators to manage all user accounts and roles within the platform.

## Technical Architecture

The AIRCID frontend is built on a modern, robust, and type-safe technology stack, prioritizing developer experience and application performance.

- **Framework**: **Next.js 15** (with App Router). We leverage server components for improved performance and a streamlined data-fetching model. The file-based routing system simplifies navigation and code organization.
- **Language**: **TypeScript**. The entire codebase is written in TypeScript to ensure type safety, reduce runtime errors, and improve code maintainability.
- **UI Components**: **ShadCN UI**. We use ShadCN for its collection of beautifully designed, accessible, and unstyled components. This allows us to build a custom design system while maintaining best practices for accessibility and reusability. Key components are located in `src/components/ui`.
- **Styling**: **Tailwind CSS**. A utility-first CSS framework that enables rapid and consistent styling directly within the markup. The application's theme (colors, fonts, etc.) is configured in `tailwind.config.ts` and `src/app/globals.css`.
- **State Management**:
  - **Global State**: React's built-in **Context API** (`AuthContext`) is used for managing global authentication state, user data, and JWTs.
  - **Form State**: **React Hook Form** is used for managing all forms, providing a performant and efficient solution for handling complex form logic, validation (with Zod), and submissions.
- **AI Integration**: **Genkit** is used to define and orchestrate flows that interact with Google's Generative AI models for features like AI Chat and Form Generation. AI-related logic is encapsulated in the `src/ai/flows` directory.
- **API Communication**: Standard `fetch` API calls are used to communicate with the backend RESTful services, with authentication tokens managed by the `AuthContext`.

## Design & UI Philosophy

- **Modern & Clean**: The UI is designed to be professional, clean, and intuitive, with a focus on usability for researchers and administrators. The primary color palette (`#42A5F5` blue) is chosen to inspire trust and confidence.
- **Component-Driven**: The interface is built from a set of reusable and composable React components, ensuring consistency across the application.
- **Responsive**: The layout is fully responsive and optimized for a seamless experience on both desktop and mobile devices, utilizing a collapsible sidebar for navigation on smaller screens.
- **Feedback & Interactivity**: The application provides clear visual feedback for user interactions, including loading states, toasts for notifications, and disabled states for buttons, ensuring a smooth user experience.

## Getting Started

To run the frontend application locally for development:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**: Create a `.env.local` file in the root of the project and configure the backend URLs:
    ```
    NEXT_PUBLIC_CORE_BACKEND_URL=http://127.0.0.1:8000
    NEXT_PUBLIC_LLM_SERVICE_URL=http://127.0.0.1:8001
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002`.
