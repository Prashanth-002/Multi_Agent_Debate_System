# 🤖 Multi-Agent Debate System using LLM

## 🚀 Overview
The **Multi-Agent Debate System** is an intelligent web-based platform that simulates structured debates using multiple AI agents. It enables users to explore topics from different perspectives through automated argument generation, counterarguments, and final evaluation.

The system leverages **Large Language Models (LLMs), Multi-Agent AI, and optional Retrieval-Augmented Generation (RAG)** to provide a dynamic and interactive debate environment.

---

## 🎯 Key Features

### 🧠 Multi-Agent AI Debate
- **Pro Agent** → Supports the topic  
- **Opponent Agent** → Provides counterarguments  
- **Judge Agent** → Evaluates and gives final verdict  

### 🔄 Structured Multi-Round Debate
- Organized debate rounds for deeper reasoning  
- Balanced argument vs counterargument flow  

### 📄 Optional RAG (Document Support)
- Upload PDF documents  
- Extracts text → splits into chunks → creates embeddings  
- Enables context-aware debates  

### ⚡ Real-Time Streaming
- WebSocket-based live debate updates  
- Users can watch debate as it happens  

### 📊 AI-Based Evaluation
- Judge agent analyzes entire debate  
- Provides:
  - Winner
  - Explanation
  - Strongest arguments  

### 🔐 Authentication & Session Management
- Secure login using Clerk  
- Stores debate history per user  

---

## 🏗️ System Architecture

The system consists of:

### 1. Frontend (React + Tailwind)
- User interface for debates  
- Real-time updates  

### 2. Backend (Node.js + Express)
- Session handling  
- Debate orchestration  

### 3. Multi-Agent System
- Pro, Opponent, Judge agents  
- Handles debate flow  

### 4. RAG Module (Optional)
- PDF processing  
- Embeddings & semantic retrieval  

### 5. AI Runtime (Ollama)
- Runs LLMs locally  
- Ensures privacy & cost efficiency  

---

## ⚙️ Tech Stack

### 🖥️ Frontend
- React.js  
- Tailwind CSS  

### ⚙️ Backend
- Node.js  
- Express.js  

### 🗄️ Database
- MongoDB (sessions, history)  
- ChromaDB (vector embeddings)  

### 🤖 AI & ML
- Ollama (Local LLMs)  

### 🔐 Authentication
- Clerk  

### 🔌 Communication
- WebSockets (real-time streaming)  

---

## 🔄 Workflow

1. User logs in  
2. Creates debate session  
3. (Optional) Uploads PDF  
4. System processes document (RAG)  
5. Debate starts  
6. Pro Agent generates argument  
7. Opponent Agent counters  
8. Multiple rounds executed  
9. Judge evaluates debate  
10. Final verdict displayed  

---

## 🧪 Installation & Setup

```bash
# Clone repository
git clone https://github.com/Prashanth-002/Multi_Agent_Debate_System.git

# Navigate to project
cd Multi_Agent_Debate_System

# Install dependencies
npm install

# Run backend
npm run server

# Run frontend
npm run dev
