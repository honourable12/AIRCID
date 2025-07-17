---

Project Name -  **AIRCID** – *AI Research Case Identification & Data Integration*

## **Problem Statement**

1. **Fragmented and Inaccessible Clinical Data:** Essential patient information resides in disparate Electronic Medical Record (EMR) systems, often alongside manual records, creating data silos that are difficult to access, integrate, and synthesize for research purposes.

The advancement of neurosurgical research is currently impeded by several critical challenges related to data management:

1. **Laborious and Error-Prone Manual Processes:** Identifying eligible patients for studies requires extensive, manual chart review. Similarly, transcribing data from EMRs into research-specific forms is time-consuming, prone to human error, and delays study initiation.
2. **Complexity of Study Criteria Operationalization:** Defining precise inclusion and exclusion criteria, particularly those involving nuanced free-text clinical descriptions, is a complex and often ambiguous process, hindering effective automated matching.
3. **Inefficient Patient Enrollment:** The manual nature of patient screening directly leads to prolonged enrollment periods, slowing down research progress and delaying the potential translation of findings into clinical practice.
4. **Challenges in Data Quality and Interpretation:** The reliance on manual entry and the difficulty in extracting structured, high-quality information from vast amounts of unstructured clinical notes compromise data consistency and the depth of analysis possible.
5. **Security and Compliance Overhead:** Handling sensitive Patient Health Information (PHI) across multiple systems demands rigorous security measures and audit trails, adding significant administrative and compliance burdens.

These challenges collectively increase research costs, delay scientific discovery, and ultimately impact patient access to cutting-edge neurosurgical care.

---

# The direct problem statement from Korle-Bu (Problem statement 2 from the docs)

AI Enhanced Research Data Integration and Case Identification Platform

Our neurosurgical unit is building dedicated research databases for selected conditions (e.g.,
myelomeningocele, brain and spine trauma, infections, brain and spine tumors) using platforms
such as REDCap. However, maintaining consistent, timely, and high-quality data entry across all
projects are challenging, especially given the busy clinical schedules of team members and
research assistants.
Additionally, identifying eligible patients prospectively during admission or surgery who meet
specific research inclusion criteria remains a largely manual and error-prone task. This can lead
to missed opportunities for data capture, especially in rare or acute conditions.
We need an AI-powered solution that can:
➢ Integrate multiple research instruments across projects into a user-friendly data interface for quick, standardized data entry
➢ Assist with real-time case matching, using EMR and clinical data to automatically identify patients who meet defined inclusion/exclusion criteria for  various ongoing studies
➢ Support automated pre-population of fields (e.g., demographics, vitals, imaging, labs) by linking to existing hospital systems
➢ Provide built-in basic statistical tools (descriptive stats, trend graphs, exportable summary tables)
➢ Offer one-click data export into more advanced statistical platforms (e.g., SPSS, R, Python) for further analysis

## **Proposed Solution**

---

Our *AI Research Case Identification & Data Integration* revolutionizes neurosurgical studies by tackling manual, error-prone data entry and slow patient identification. It automatically pulls and integrates patient information (demographics, vitals, labs, imaging) from various hospital systems into one easy-to-use interface, pre-populating forms to **cut workload and errors**. The system constantly monitors incoming data, using **AI to flag eligible patients in real-time** during admission or surgery. Built-in analytics offer quick insights and reporting. This solution doesn't just streamline workflows and boost data quality; it ensures **critical cases are precisely identified**, ultimately enhancing research outcomes and directly improving patient care.

---

## **Executive Summary**

This proposal outlines a comprehensive solution for a transformative web-based platform designed to revolutionize neurosurgical research data management. Leveraging a robust microservices architecture, the platform integrates core backend functionalities developed in C#, specialized AI and data integration services utilizing Python, and a dynamic frontend built with React. A key innovation is the integration of Generative AI (GenAI) capabilities to augment complex tasks like criteria definition, intelligent form generation, and nuanced clinical note summarization. The platform aims to streamline workflows by automating EMR data extraction with robust de-duplication, accelerating patient identification through advanced AI matching, standardizing data collection, and providing secure tools for comprehensive data management and export. This will significantly boost research efficiency, enhance data quality, and ultimately accelerate breakthroughs in neurosurgical care.

---

**Solution Overview: The Neurosurgical Research Platform – A Detailed Development Plan**

Our solution is an integrated, web-based platform built on a **modular, microservices-oriented architecture**. This design principle ensures that independent services handle different functionalities, promoting flexibility, scalability, and maintainability. These services communicate primarily via well-defined RESTful APIs and asynchronous message queues, ensuring robust interoperability.

**A. Core Components & Detailed Design:**

1. **Central Backend Service (C# with ASP.NET Core, PostgreSQL Database)**
    - **Role:** This service serves as the platform's primary orchestration hub and central nervous system. It is responsible for managing the core business logic and data integrity.
    - **Technologies:** Developed using **C#** and the **ASP.NET Core** framework for building high-performance, secure, and scalable web APIs. **PostgreSQL** is employed as the primary relational database, chosen for its robustness, extensibility (including JSONB support for flexible schemas), and strong support for complex queries.
    - **Key Functions & Connections:**
        - **API Exposure:** Exposes secure RESTful APIs that the Frontend consumes for all user interactions, and that other microservices call for core data management.
        - **User Authentication & Authorization (RBAC):** Implements robust Role-Based Access Control (RBAC) to ensure that users only access functionalities and data relevant to their assigned roles (e.g., researcher, administrator).
        - **Research Study Management:** Manages the lifecycle of research studies, including defining study projects, storing their objectives, and managing the structured definitions of inclusion/exclusion criteria.
        - **Dynamic Form Management:** Stores and serves JSON Schema definitions for dynamic data collection forms. This allows for flexible form creation per study without requiring code changes for each new form.
        - **Data Orchestration & Aggregation:** Orchestrates data flow from various sources into the PostgreSQL database, ensuring data integrity and consistency. It serves as the single source of truth for all structured research data.
        - **Comprehensive Audit Trails:** Logs every data access, entry, and modification for compliance, security, and accountability.
        - **Core Data Export Logic:** Contains the logic for securely extracting and transforming curated datasets into various formats (e.g., CSV, Parquet, SPSS-compatible) for downstream analysis.
2. **EMR Integration & Data Pre-population Microservice (Python, FastAPI)**
    - **Role:** Dedicated to securely connecting with external EMR systems, extracting patient data, and preparing it for research use.
    - **Technologies:** Developed in **Python** using the **FastAPI** framework for efficient API creation and asynchronous operations. It leverages specialized Python libraries like `fhir.resources` for HL7 FHIR standard compliance and potentially `hl7apy` for HL7 v2, ensuring robust interoperability.
    - **Key Functions & Connections:**
        - **Secure EMR Connectivity:** Establishes secure, authenticated connections to hospital EMR systems (e.g., via OAuth 2.0).
        - **Patient Data Fetching:** Fetches a wide range of patient data, including demographics, admission/discharge/transfer (ADT) information, vital signs, lab results, imaging reports (metadata/links), medication lists, and diagnoses.
        - **Data Transformation & Mapping:** Transforms raw EMR data into standardized research-ready formats and maps it to the schemas defined in the Central Backend.
        - **Master Data Management (MDM) & Patient De-duplication:** A critical function of this service is to implement robust MDM principles. It uses advanced algorithms to identify and **de-duplicate patient records** that may appear across different EMR instances or within the same EMR under varying identifiers, ensuring a single, accurate patient profile for research.
        - **API to Central Backend:** Sends the clean, de-duplicated, and transformed patient data to specific APIs exposed by the Central Backend Service for storage in PostgreSQL. This data is then used to pre-populate research forms.
        - **Operational Modes:** Can operate on scheduled polls, be event-driven (if EMRs support event notifications), or on-demand via calls from the Central Backend.
3. **AI-Powered Case Matching Microservice (Python, FastAPI)**
    - **Role:** Identifies potentially eligible patients for active research studies based on defined criteria.
    - **Technologies:** Built in **Python** with **FastAPI** for its high performance and suitability for ML model serving. Utilizes leading data science libraries such as **Scikit-learn**, **Pandas**, and **NumPy**. For text-based criteria, it integrates **spaCy** or **NLTK** for sophisticated Natural Language Processing (NLP).
    - **Key Functions & Connections:**
        - **Patient Data Ingestion:** Receives patient data (ideally de-identified or pseudonymized for this service) from the Central Backend via API calls.
        - **Criteria Processing:** Processes patient data against the active inclusion/exclusion criteria.
        - **Rule-Based Matching:** Applies defined logical rules (e.g., age ranges, specific lab values).
        - **NLP for Free-Text:** Extracts structured information (e.g., specific symptoms, past medical history mentions) from unstructured clinical notes using advanced NLP techniques.
        - **Machine Learning Models (Optional/Advanced):** If sufficient historical labeled data is available, trained ML classifiers can predict eligibility based on complex patterns.
        - **Results Transmission:** Returns a list of potentially eligible patients, along with confidence scores or reasons for matching, back to the Central Backend via API. This service is designed to be independently scalable and deployable, allowing for rapid model updates.
4. **Generative AI / LLM Augmentation Microservice (Python, FastAPI)**
    - **Role:** Provides intelligent assistance and automation for complex text-based tasks by leveraging advanced Large Language Models.
    - **Technologies:** Developed in **Python** using **FastAPI** to expose LLM functionalities as services. It will integrate with leading **LLM platforms/APIs** (e.g., Google's Gemini, OpenAI, or host-optimized open-source models).
    - **Key Functions & Connections:**
        - **Intelligent Criteria Augmentation:** Receives researchers' natural language descriptions of study criteria from the Frontend (via Central Backend) and uses LLMs to suggest clearer wording, identify potential ambiguities, or propose structured rule templates, sending refined suggestions back.
        - **Smart Form Generation:** Based on study objectives or selected criteria, it generates preliminary JSON schema definitions for dynamic data collection forms, suggesting relevant data points and field types.
        - **Clinical Note Summarization & Extraction:** Processes lengthy unstructured clinical narratives (e.g., from EMRs via Central Backend) to generate concise summaries or extract specific, highly contextual information into structured fields, improving data utility.
        - **Automated Research Report Generation:** Assists in generating narrative summaries of patient cohorts, study progress, or aggregated findings, transforming raw data into coherent textual reports.
        - **Contextual Q&A and Literature Review (RAG):** Integrates with a curated knowledge base of neurosurgical literature and internal study documents. Researchers can ask questions, and the LLM provides instant, context-aware answers by retrieving relevant information and synthesizing responses.
        - **Integration:** Communicates with the Central Backend and directly with the Frontend (for real-time user assistance) via APIs.
5. **Frontend User Interface (Web Application)**
    - **Role:** Provides a unified, intuitive, and responsive interface for all user interactions with the platform.
    - **Technologies:** Developed using **React.js** (a JavaScript library) with **JavaScript/TypeScript** for robust development. It will utilize a modern UI component library (e.g., Material-UI, Ant Design) for consistent design and **Chart.js** or **D3.js** for data visualization.
    - **Key Functions & Connections:**
        - **Unified Data Interface:** Offers a clean, intuitive, and responsive web application for all user interactions.
        - **Study Management:** Allows authorized users to create and manage research studies, define criteria (with GenAI assistance), and design/select data collection forms.
        - **Dashboard & Alerts:** Provides an overview of active studies, patient enrollment progress, and alerts for newly matched patients identified by the AI services.
        - **Standardized Data Entry:** Presents dynamic forms that are pre-populated with data from the EMR Integration module via the Central Backend. It clearly distinguishes pre-populated vs. manually entered data.
        - **Case Matching Visualization:** Displays lists of potentially eligible patients, allowing researchers to review, validate, and confirm eligibility.
        - **Built-in Basic Statistical Tools:** Offers descriptive statistics (mean, median, mode, SD, frequencies) and simple trend graphs, pulling data from the Central Backend.
        - **One-Click Data Export:** Enables secure export of curated datasets in formats compatible with common statistical software (e.g., CSV, Parquet, SPSS-compatible via CSV + syntax file).
        - **Direct GenAI Interaction:** Integrates interactive elements where users can directly prompt the GenAI/LLM service for assistance (e.g., refining criteria, summarizing notes in pop-ups).
6. **Asynchronous Task Processing (Celery with RabbitMQ/Redis)**
    - **Role:** Handles long-running or background tasks to prevent the main application threads from being blocked, ensuring high responsiveness.
    - **Technologies:** **Celery** (a Python-based distributed task queue) integrated with **RabbitMQ** (a robust message broker) or **Redis** (an in-memory data store) as the message broker.
    - **Key Functions & Connections:**
        - **Background Processing:** Manages tasks like scheduled EMR data pulls, large batch data processing, complex AI matching jobs (dispatched by the Central Backend or other AI services), and the generation of extensive reports.
        - **Integration Points:** Both the C# Central Backend and other Python microservices can enqueue tasks into the Celery system, which are then picked up and executed by dedicated Celery worker processes. This offloads computational burdens from the main API services.

**Data Flow & Interoperability:**

The system's strength lies in its orchestrated data flow:

1. **Study Definition:** Researchers define studies and criteria via the **Frontend**, communicating with the **C# Central Backend**. GenAI/LLM services can assist this process.
2. **EMR Ingestion:** The **Python EMR Integration Microservice** pulls raw patient data from hospital EMRs. It performs crucial **Master Data Management (MDM) and patient de-duplication**, then transforms and sends clean, standardized data to the **C# Central Backend** via API calls.
3. **Data Storage & Orchestration:** The **C# Central Backend** stores this comprehensive patient data in **PostgreSQL**.
4. **AI Matching Trigger:** The **C# Central Backend** sends relevant patient data to the **Python AI-Powered Case Matching Microservice**.
5. **Eligibility Results:** The **AI-Powered Case Matching Microservice** processes the data against criteria (using NLP, ML) and returns eligibility results to the **C# Central Backend**.
6. **GenAI Augmentation:** The **C# Central Backend** orchestrates calls to the **Python GenAI/LLM Augmentation Microservice** for tasks like summarizing notes, refining criteria, or generating forms. The Frontend can also directly interact with the GenAI service for real-time assistance.
7. **User Interaction:** The **Frontend** retrieves study data, patient lists, and pre-populated forms from the **C# Central Backend** for user review and data entry.
8. **Asynchronous Tasks:** For long-running operations (e.g., extensive EMR polls, large exports, complex AI batch processing), the **C# Central Backend** or other services enqueue tasks into **Celery/RabbitMQ**, which are processed by dedicated workers.

---

**Key Technical & Operational Considerations:**

**A. Security & Compliance:**

- **Role-Based Access Control (RBAC):** Rigorous RBAC implemented throughout the C# Central Backend.
- **Encryption:** Data encrypted at rest (PostgreSQL) and in transit (TLS/SSL for all API communication).
- **Detailed Audit Logs:** Comprehensive logs of all data access, modifications, and system events, critical for compliance.
- **Adherence to Regulations:** Strict adherence to **HIPAA** (Health Insurance Portability and Accountability Act) and **GDPR** (General Data Protection Regulation) guidelines, including principles of "Privacy by Design."
- **Data Minimization & Masking:** Implementing strategies to de-identify or pseudonymize data where possible, especially before sending to external AI services, and ensuring data masking for certain views/exports.
- **Secure API Design:** Implementing best practices for API security, including rate limiting, input validation, and secure token management.
- **Regular Audits:** Scheduled security audits and penetration testing to identify and mitigate vulnerabilities.

**B. Data Governance & Quality:**

- Beyond de-duplication, establishing clear data governance policies regarding data ownership, lineage, quality standards, and retention is crucial.
- Automated data validation rules, enforced by the C# backend, will ensure data consistency at the point of entry.

**C. Scalability & Performance:**

- The **microservices architecture** is inherently scalable, allowing individual components (e.g., AI services) to be scaled independently based on load.
- **C#/ASP.NET Core** and **Python/FastAPI** are both high-performance frameworks, capable of handling significant request volumes.
- **Containerization (Docker)** and **orchestration (Kubernetes)** will be used for efficient deployment, automated scaling, and resilient management of services.
- **Asynchronous task queues (Celery/RabbitMQ)** prevent bottlenecks by offloading long-running operations.
- **PostgreSQL** can be scaled effectively through techniques like connection pooling, indexing, read replicas, and potentially sharding for very large datasets.

**D. DevOps & Observability:**

- Implementation of robust **Continuous Integration/Continuous Deployment (CI/CD)** pipelines for automated testing, building, and deployment of both C# and Python services.
- Centralized **monitoring (e.g., Prometheus/Grafana)**, **logging (e.g., ELK stack)**, and **distributed tracing** to provide full visibility into system health, performance, and to rapidly diagnose issues.

**E. User Experience & Training:**

- A strong focus on UX design for the React frontend will ensure an intuitive and efficient user experience.
- Comprehensive training and ongoing support will be provided to researchers and coordinators to maximize platform adoption and effectiveness.

---

**Implementation Roadmap (Phased Approach):**

We propose a phased development approach to deliver core value quickly and iteratively build out advanced capabilities.

1. **Phase 1 (Minimum Viable Product - Core Functionality):**
    - **Focus:** Establish the foundational C# Central Backend with essential study management (creation, basic criteria storage), user authentication/RBAC, and PostgreSQL integration.
    - **Frontend:** Implement the core React.js Frontend for manual data entry into defined forms and basic CSV data export.
    - **EMR Integration:** Develop a foundational Python EMR Integration module for automated pre-population of a few key demographic fields (e.g., patient ID, name, DOB) via basic FHIR queries from a single EMR system. Include initial patient de-duplication logic.
    - **AI:** Implement simple, rule-based case matching directly within the C# Central Backend for 1-2 critical, easily quantifiable criteria.
2. **Phase 2 (Enhancements & Initial AI/GenAI Integration):**
    - **EMR Integration:** Expand the Python EMR Integration module to support more diverse data types (labs, meds, diagnoses) and robust connections to additional EMR systems. Enhance patient de-duplication algorithms.
    - **AI Services:** Develop the dedicated Python AI-Powered Case Matching Microservice with more sophisticated rule-based logic and initial NLP capabilities for free-text criteria.
    - **GenAI Integration:** Implement initial functionalities for the Python Generative AI / LLM Augmentation Microservice, focusing on intelligent criteria refinement assistance or basic clinical note summarization.
    - **Asynchronous Processing:** Introduce Celery/RabbitMQ/Redis for asynchronous task processing, integrating it with the C# backend to handle tasks like large EMR data pulls or complex exports.
    - **Frontend:** Integrate built-in basic statistical tools and enhance dashboards.
3. **Phase 3 (Advanced Features & Optimization):**
    - **AI/GenAI Refinement:** Further refine AI models (traditional ML) and significantly expand Generative AI capabilities (e.g., smart form generation, advanced reporting, full RAG system for contextual Q&A).
    - **Optimization:** Optimize overall system performance, scalability, and resilience across all services.
    - **Data Export:** Implement comprehensive one-click export options for various platforms (e.g., full SPSS-compatible format, Parquet).
    - **MDM Enhancement:** Continuously improve MDM capabilities within the EMR Integration service for robust, scalable patient de-duplication across a growing number of diverse sources.
    - **Advanced Analytics:** Explore integration with more advanced analytical capabilities or data warehousing solutions for deeper research insights.

---

**Project Impact & Beneficiaries**

**A. Social Impact:**

This project has profound social impact by fundamentally accelerating neurosurgical research. By automating laborious tasks, intelligent assistance in design, and unlocking insights from complex clinical text through GenAI, it significantly speeds up the scientific discovery process. This leads to faster development of new diagnostic methods and treatment modalities for neurological conditions, ultimately providing patients with earlier access to innovative care and improving overall health outcomes globally. It empowers researchers to focus on higher-value scientific inquiry, fostering innovation and collaboration in the neurosurgical community.

**B. Commercial Potential:**

The platform possesses strong commercial potential, capable of being adapted and offered to a wider market within healthcare research. It could be licensed as a comprehensive software solution to other neurosurgical departments, research hospitals, or academic institutions globally. Alternatively, a hosted Software-as-a-Service (SaaS) model could provide a recurring revenue stream, abstracting infrastructure complexities for clients. Furthermore, specialized microservices, particularly the AI-Powered Case Matching Service, the Generative AI / LLM Augmentation Service, and the advanced EMR Integration/MDM module, could be commercialized as standalone services or APIs, addressing specific needs within the broader healthcare interoperability and intelligent data processing landscape.

**Desired Outcomes & Metrics to Measure Success:**

- **Time to Patient Enrollment:** Reduce average patient enrollment time by **30-50%** within the first year of full platform deployment, directly attributable to AI/GenAI-powered matching and pre-population.
- **Research Study Volume & Complexity:** Increase the number of active neurosurgical research studies managed on the platform by **25% annually**, reflecting enhanced capacity to conduct more intricate studies.
- **Data Quality & Richness:** Achieve a data consistency rate of **98%** and a data completeness rate of **95%** across key variables, with a **20% increase in structured data extracted from unstructured notes** via GenAI, demonstrating improved data utility.
- **Research Output:** Contribute to a quantifiable increase (e.g., **15-20%**) in high-impact publications and presentations originating from research managed on the platform.
- **User Satisfaction & Efficiency:** Achieve an **85%+ user satisfaction rate** on the platform's usability and a **25% reported increase in researcher efficiency** directly linked to AI/GenAI features.
- **LLM Accuracy & Utility:** Establish and track metrics for the accuracy of LLM-generated criteria suggestions, text summarizations, and extractions (e.g., precision, recall, human review time saved).
- **EMR Integration Success:** Successfully integrate with a minimum of **3 major EMR systems** within the first two years, demonstrating robust de-duplication capabilities and scalable interoperability.

---