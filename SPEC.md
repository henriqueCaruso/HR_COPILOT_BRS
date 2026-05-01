# RHIÁ UniFECAF - Project Specification

## Overview
RHIÁ UniFECAF is an AI-powered assistant designed for Brazilian academic and HR professionals at UniFECAF. It streamlines the creation of corporate/academic texts (emails, announcements, policies) and grounds its responses in company-specific documents.

## Features
1. **Authentication:** Secure Google Login via Firebase Authentication.
2. **Advanced Document Management:** Upload manuals and documents using the Gemini File API. Files are stored and organized locally through "Virtual Folders" (Políticas, Manuais, Templates, Outros).
3. **Chat Interface Enhancements:** Specialized chat interface to prompt RHIÁ. Features mutually exclusive Quick Action buttons ("E-mail", "WhatsApp", "Manual", "Comunicado") for setting the output format internally, keeping the input clean. Features a "Pensamento Profundo" toggle to use Gemini's `thinkingLevel: HIGH` feature with internal reasoning. Or any format and thinking combintation.
4. **Model Selector:** UI dropdown for dynamically switching between Gemini models (`gemini-3.1-pro-preview`, `gemini-3-flash`, `gemini-3-flash-lite`).
5. **Strict Formatting:** RHIÁ is explicitly instructed to ALWAYS return generated content natively wrapped in markdown code blocks to facilitate effortless copying.
6. **Data Persistence:** Chat history and document metadata stored in Firestore.

## Architecture
- **Frontend:** React, Vite, Tailwind CSS. Features clean, modern, and lightweight "academic" aesthetic.
- **Backend/BaaS:** Firebase (Auth & Firestore).
- **AI Integration:** Google GenAI SDK (`@google/genai`) for Chat and File API operations. 

