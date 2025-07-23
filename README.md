# Sociopal

A domain expert AI voice agent for sociology.

<details>
<summary>Learn more about Sociopal</summary>

Sociopal is a Corrective RAG (CRAG) agent powered by a vectorDB containing curated sociology information and web search. It is designed to answer questions and provide detailed explanations related to sociology.

</details>

## Technology Stack

**Frontend:**
- Next.js
- AssemblyAI (speech-to-text)
- ElevenLabs (text-to-speech)

**Backend:**
- FastAPI
- LangGraph
- Groq
- ChromaDB
- DuckDuckGo (web search)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/k0msenapati/sociopal.git
```

### 2. Navigate to the Project Directory

```bash
cd sociopal
```

---

### Frontend Setup

```bash
cd ui
bun i
cp .env.example .env.local
```
Fill in your ElevenLabs and AssemblyAI API keys in `.env.local`.

Start the development server:

```bash
bun dev
```

---

### Backend Setup

```bash
cd ../agent-py
uv sync
source .venv/bin/activate
cp .env.example .env
```
Fill in your Groq API key in `.env`.

#### Index the Data

```bash
uv run --active -m sociology_agent.index
```

#### Run the Server

```bash
uv run --active uvicorn sociology_agent.server:app --reload
```

