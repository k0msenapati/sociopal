import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .agent import graph
from .config import PERSIST_DIRECTORY, logger


app = FastAPI(title="SocioPal CRAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists(PERSIST_DIRECTORY):
    logger.warning(
        "ChromaDB directory '%s' not found. Agent will operate with web search fallback.",
        PERSIST_DIRECTORY,
    )

rag_agent = graph


class QueryRequest(BaseModel):
    question: str
    web_search: bool = False


thread_id_counter = 1


@app.post("/query")
async def query_agent(request: QueryRequest):
    global thread_id_counter

    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    start_time = time.time()
    thread_id = str(thread_id_counter)
    thread_id_counter += 1

    logger.info("[API] Request #%s: '%s' (web_search=%s)", thread_id, question, request.web_search)

    try:
        final_state = rag_agent.invoke(
            {
                "question": question,
                "documents": [],
                "generation": "",
                "web_search": request.web_search,
                "retry_count": 0,
                "messages": [],
            },
            config={"configurable": {"thread_id": thread_id}},
        )

        elapsed = time.time() - start_time
        answer = final_state.get("generation", "")
        logger.info("[API] Request #%s completed in %.2fs (%d chars)", thread_id, elapsed, len(answer))

        return {
            "question": question,
            "answer": answer,
        }

    except Exception as e:
        logger.error("[API] Request #%s failed: %s", thread_id, e)
        raise HTTPException(status_code=500, detail=str(e))
