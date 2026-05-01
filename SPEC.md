# RHIÁ UniFECAF - Project Specification

## 1. Project Vision
RHIÁ UniFECAF (HR Copilot) is conceptualized to tackle the operational bottlenecks within Human Resources and Internal Communication departments. Often burdened with repetitive tasks like drafting institutional emails, WhatsApp notices, policy summaries, and meeting minutes, the team loses valuable strategic capacity. The vision for RHIÁ is to act as a highly specialized AI-powered generative assistant that produces ready-to-copy, culturally aligned, and well-written corporate communications through optimized, pre-engineered prompts and Retrieval-Augmented Generation (RAG).

## 2. Platform Architecture & Stack
RHIÁ leverages a modern Single Page Application (SPA) structure integrated with robust backend services:
- **Frontend / Client View:** React 19 combined with Vite 6. Designed with an academic, clean, and lightweight aesthetic using Tailwind CSS 4 and framer-motion for UI interactions. Features strict Portuguese (PT-BR) UI nomenclature.
- **Backend-as-a-Service (BaaS):** Firebase ecosystem. Exclusively mapped to Firebase Authentication (Google Auth) and Firestore for logging user iterations, chat persistence, and document metadata tracking in strict compliance with basic security constraints mapping.
- **GenAI Core & RAG Management:** Fully integrated with Google's `@google/genai` TypeScript SDK. The system utilizes `gemini-3.1-pro-preview` for deep reasoning capabilities, alongside fallback agile models (`flash` & `flash-lite`). Features a custom RAG (Virtual Folders) manager utilizing the Gemini File Search API to query local corporate templates and policies securely.

## 3. Features & Implementation Flow
1. **Authentication Gate:** Protected routes enforced via `AuthContext.tsx` evaluating active Firebase user states.
2. **Advanced Document Management / RAG:** Admins manipulate a dynamic upload UI (`DocumentUpload.tsx`) sending supported files (PDF, TXT, MD, CSV) directly to the GenAI storage. The system deeply utilizes the **File Search tool integrated directly through the Google Gen AI SDK (`@google/genai`)** for vectorized document querying. Furthermore, a **native integration with Firebase Firestore** operates invisibly to securely bind document URIs and metadata to "Virtual Folders" on a per-user authentication basis, preventing crosstalk while compartmentalizing query scopes.
3. **Chat Interface Enhancements (Dynamic Prompting):** 
   - A specialized chat UI (`ChatLayout.tsx`) bypasses traditional conversational fatigue by displaying Quick Action buttons ("E-mail", "WhatsApp", "Manual", "Comunicado").
   - **System Prompt Rules:** The prompt orchestrator rigidly bounds output: `Agent RHIÁ MUST always return generated texts wrapped inside formatted markdown code blocks for easy copying.` and operates completely bound to UniFECAF's corporate tone logic.
4. **Model Selector:** In-chat dropdown allowing real-time toggle between `gemini-3.1-pro-preview`, `gemini-3-flash`, and `gemini-3-flash-lite`, minimizing costs for simpler WhatsApp generations versus complex Policy summaries.
5. **Thinking Protocol Pipeline:** Incorporates Gemini's deeply integrated `thinkingLevel: HIGH` logic accessible through a "Deep Thought" UI toggle flag to expand logic iterations before output generation.

## 4. Code Principles & Data Integrity
- **Code Language:** The underlying source code logic and internal documentation structure remain exclusively and *strictly in English*, whereas user facing components (UI) remain heavily normalized in Portuguese (PT-BR).
- **Data Privacy:** Architecture is deployed ensuring robust rules under Firestore to deny arbitrary cross-user scope reads, isolating query contexts per authenticated tenant to align with regional data privacy considerations (LGPD limits). 

