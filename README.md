# MirrorMind - Your Personal AI Companion Creator

MirrorMind is a web application that allows users to create, customize, and chat with personalized AI personas. It leverages a local WebLLM engine to bring these personas to life, offering a unique and interactive experience directly in your browser.

## Live Demo & Video

- **Try MirrorMind Live:** [Link to Deployed Webapp - Placeholder]
- **Watch the Demo:** [Link to YouTube Demo Video - Placeholder]

## Overview

The core idea behind MirrorMind is to provide a platform where users can define the characteristics, personality traits, and background stories of AI entities. Once a persona is created through a guided questionnaire, users can engage in conversations with it, with the AI responding according to the defined profile. All data, including persona definitions and chat histories, is stored locally in the user's browser.

## Features

- **Persona Creation:**
  - Guided questionnaire with multiple-choice and open-ended questions.
  - Define name, tone, relationship to the user (including custom definitions), communication style, personality, background, and more.
  - Interactive 3D model viewer that visually represents the progress of persona creation.
- **Persona Management ("My Personas"):**
  - View a list of all created personas.
  - Search and filter personas.
  - Edit existing persona details.
  - Delete personas (this also removes associated chat history).
  - Persona icons are color-coded based on selected pronouns for quick visual identification.
- **Chat Interface:**
  - Engage in conversations with your created AI personas.
  - Support for multiple, separate chat histories per persona.
  - Chat names can be edited for better organization.
  - User messages can be edited, which then triggers a new response from the persona based on the updated context.
  - Real-time streaming of AI responses.
- **Local WebLLM Engine:**
  - Powered by `@mlc-ai/web-llm`, running a language model (e.g., Llama-3.2-3B-Instruct) directly in the browser.
  - The engine is initialized once per session and persists across different chats and personas to save resources and time.
  - Dynamic system prompt generation based on the active persona's profile ensures the AI stays in character.
- **User Experience:**
  - Responsive design for use on various screen sizes.
  - Dark/Light theme toggle.
  - Intuitive navigation and user interface.
  - All data is stored locally using browser `localStorage`.

## Tech Stack

- **Frontend:** Next.js (React framework)
- **Language:** JavaScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **3D Rendering:** Three.js / React Three Fiber (`@react-three/fiber`, `@react-three/drei`) for the `ModelViewer`.
- **AI Engine:** `@mlc-ai/web-llm` for in-browser language model inference.
- **State Management:** React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`)
- **Routing:** Next.js App Router

## Project Structure

```
mirrormind/
├── app/                      # Next.js App Router (pages and layouts)
│   ├── create-persona/
│   ├── edit-persona/[personaId]/
│   ├── my-personas/
│   ├── chat/[personaId]/
│   ├── layout.js
│   └── page.js               # Home page
├── components/               # Reusable React components
│   ├── ModelViewer.js
│   └── Navbar.js
├── lib/                      # Utility functions and data
│   ├── local-storage.js    # Handles all localStorage interactions
│   └── questionnaire-data.js # Defines questions for persona creation
├── public/                   # Static assets
│   └── progress/scene.gltf   # 3D model for ModelViewer
├── README.md                 # This file
└── ...                       # Other Next.js config files (next.config.js, tailwind.config.js, etc.)
```

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [<repository-url> # Replace <repository-url> with the actual URL if available](https://github.com/Varun-Patkar/mirrormind.git)
    cd mirrormind
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Notes

- The AI model (`Llama-3.2-3B-Instruct-q4f16_1-MLC` or similar) will be downloaded by the WebLLM engine on the first visit to the chat page. This can take some time and requires a stable internet connection. Subsequent visits should be faster as the model may be cached by the browser.
- Performance of the local LLM depends heavily on the user's device capabilities.
- All data is stored locally; there is no backend server or database involved for user data.

---

This project was developed as a personal endeavor.
