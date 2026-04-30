# HR Copilot BRS - Project Specification

## Overview
HR Copilot BRS is an AI-powered assistant designed for Brazilian HR professionals. It streamlines the creation of corporate texts (emails, announcements, policies) and grounds its responses in company-specific documents.

## Features
1. **Authentication:** Secure Google Login via Firebase Authentication.
2. **Document Context:** Upload human resource manuals and documents using the Gemini File API to provide context for AI generation.
3. **HR Chat Interface:** A specialized chat interface to prompt the AI for corporate texts in Portuguese (pt-br).
4. **Data Persistence:** Chat history and document metadata stored in Firestore.

## Architecture
- **Frontend:** React, Vite, Tailwind CSS.
- **Backend/BaaS:** Firebase (Auth & Firestore).
- **AI Integration:** Google GenAI SDK (`@google/genai`) for Chat and File API operations.
