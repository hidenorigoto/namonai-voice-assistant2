# Voice Discussion PoC: Architecture Document

## 1. Overview

This document outlines the architecture for a web-based Proof of Concept (PoC) system that enables users to engage in voice-based discussions with an AI. The system will first investigate the user's topic to gather materials for a deeper discussion, and then use another AI API to understand the conversation, generate responses, and vocalize them.

## 2. Requirements

### 2.1. Functional Requirements

- **Voice Input:** Users can input discussion topics and subsequent conversation through voice.
- **AI-driven Topic Investigation:** The system investigates the user's topic to generate a structured document for deeper discussion.
- **Interactive Voice Discussion:** The system engages in a voice-based discussion with the user based on the investigated material.
- **Display of Investigation Results:** The results of the AI's investigation are displayed on the screen for the user to reference.

### 2.2. Non-Functional Requirements

- **Low Latency:** The system should provide a smooth, near-real-time voice discussion experience.
- **Security:** API keys for external services must be securely managed.
- **Scalability:** While a PoC, the architecture should be designed with future scalability in mind.

## 3. Architecture

We will adopt a hybrid architecture that combines a front-end application with a minimal back-end (API Proxy/BFF) to ensure security and enable performance optimizations like streaming.

### 3.1. System Configuration Diagram

```mermaid
graph TD
    A[User] <--> B[Web Browser (React/Next.js)];
    B <--> C[Back-End (Node.js/Express)];
    C --> D[AI Service (e.g., OpenAI API)];
    subgraph AI Service
        D1[Speech-to-Text (Whisper)];
        D2[LLM for Investigation (GPT-4o)];
        D3[LLM for Conversation (GPT-4o)];
        D4[Text-to-Speech (TTS API)];
    end
    D --- D1;
    D --- D2;
    D --- D3;
    D --- D4;
```

### 3.2. Technology Stack

- **Front-End:** **React (Next.js)**
  - **Reason:** A popular and mature ecosystem for building dynamic user interfaces. Next.js allows for easy future expansion.
- **Back-End:** **Node.js (with Express)**
  - **Reason:** Enables development in the same language as the front-end, and is well-suited for I/O-heavy tasks like proxying API requests.
- **AI Services:** **OpenAI API** (or a similar integrated service)
  - **Reason:** Provides high-quality, integrated APIs for Speech-to-Text, LLM, and Text-to-Speech, simplifying PoC development.

### 3.3. Component Roles

- **Front-End:**
  - Handles user interface, including microphone input and audio playback.
  - Sends user's voice data to the back-end.
  - Receives and displays investigation results (Markdown).
  - Receives and plays back AI's voice responses.
- **Back-End (API Proxy):**
  - Securely stores and manages the AI service API key.
  - Provides API endpoints for the front-end.
  - Orchestrates calls to the external AI service (STT -> Investigate -> Converse -> TTS).
  - Implements streaming logic to minimize perceived latency.

## 4. Data and Process Flow

1.  **Topic Input:**
    1.  The user clicks a "record" button and speaks the topic.
    2.  The front-end captures the audio and sends it to the back-end.
    3.  The back-end sends the audio to the **Speech-to-Text (STT) API**.

2.  **Investigation & Summarization:**
    1.  The back-end receives the transcribed text from the STT API.
    2.  It sends the text to the **LLM API (AI #1)** with a prompt to investigate the topic and generate a structured Markdown document (including summaries, key points, references, etc.).
    3.  The back-end receives the Markdown document. It also generates a very brief summary of the document for the initial voice response.
    4.  The back-end sends the full Markdown document to the front-end for display.

3.  **Initiating Discussion:**
    1.  The back-end sends the brief summary text to the **Text-to-Speech (TTS) API**.
    2.  The back-end streams the resulting audio data to the front-end, which plays it immediately.
    3.  The AI's response is user-driven, ending with an open-ended question like, "What are your thoughts on this topic?" or "What aspect are you most interested in?"

4.  **Interactive Discussion Loop:**
    1.  The user speaks their response.
    2.  The front-end captures the audio and sends it to the back-end.
    3.  The back-end orchestrates the following calls:
        a.  **STT API:** Transcribes the user's speech.
        b.  **LLM API (AI #2):** Sends the new transcription, the conversation history, and the initial investigation document (as context) to generate a conversational reply.
        c.  **TTS API:** Converts the reply text into speech.
    4.  The back-end streams the audio response back to the front-end for playback.
    5.  The loop continues until the user ends the conversation.

## 5. Key Considerations

- **Streaming Implementation:** To ensure a smooth user experience, the back-end will implement response streaming for both the LLM and TTS APIs. This allows the front-end to start playing the AI's response before the full generation is complete.
- **API Key Security:** The API key for the AI service is stored exclusively on the back-end and is never exposed to the client-side, mitigating the risk of unauthorized use.
- **User-Driven Interaction:** The initial prompt for discussion is designed to be open-ended, giving the user control over the conversational direction.
