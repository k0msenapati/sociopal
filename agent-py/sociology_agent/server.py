import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .agent import graph
from .config import PERSIST_DIRECTORY


app = FastAPI(title="LangGraph RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists(PERSIST_DIRECTORY):
    raise RuntimeError(
        f"Chroma DB directory '{PERSIST_DIRECTORY}' not found. "
        "Please run 'uv run scripts/index.py' first to create the vector database."
    )

rag_agent = graph

class QueryRequest(BaseModel):
    question: str
    web_search: bool = False

thread_id_counter = 1


@app.post("/query")
async def query_agent(request: QueryRequest):
    global thread_id_counter

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        print(f"Processing query: {request.question}")

        final_state = rag_agent.invoke(
            {
                "question": request.question,
                "documents": [],
                "generation": "",
                "web_search": request.web_search,
                "messages": [],
            },
            config={"configurable": {"thread_id": str(thread_id_counter)}},
        )

        thread_id_counter += 1

        return {
            "question": request.question,
            "answer": final_state["generation"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
