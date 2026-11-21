from langchain.schema import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage

from .config import llm, web_search_tool, get_retriever, logger
from .state import GraphState


def retrieve(state: GraphState):
    """
    Retrieves relevant document chunks from the vector store.
    """
    question = state.get("question", "").strip()
    if not question:
        messages = state.get("messages", [])
        for msg in reversed(messages):
            if isinstance(msg, HumanMessage):
                question = str(msg.content).strip()
                break

    if not question:
        logger.warning("[Retrieve] Empty question received")
        return {"documents": [], "web_search": state.get("web_search", False)}

    retriever = get_retriever()
    if retriever is None:
        logger.warning("[Retrieve] Retriever unavailable -> web_search")
        return {"documents": [], "web_search": True, "question": question}

    try:
        documents = retriever.invoke(question)
        logger.info("[Retrieve] Found %d chunk(s) from ChromaDB", len(documents))
        return {
            "documents": documents,
            "question": question,
            "web_search": state.get("web_search", False),
        }
    except Exception as e:
        logger.error("[Retrieve] ChromaDB retrieval error: %s", e)
        return {"documents": [], "web_search": True, "question": question}


def grade_documents(state: GraphState):
    """
    Evaluates whether retrieved documents are relevant to the question in a single batch.
    """
    question = state.get("question", "")
    documents = state.get("documents", [])
    force_web_search = state.get("web_search", False)

    if not documents:
        logger.info("[Grade] No documents retrieved -> web_search")
        return {"documents": [], "web_search": True}

    if force_web_search:
        logger.info("[Grade] Web search requested by user -> web_search")
        return {"documents": documents, "web_search": True}

    formatted_chunks = "\n\n".join(
        [f"Chunk [{i}]:\n{d.page_content.strip()[:600]}" for i, d in enumerate(documents, 1)]
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an evaluator assessing the relevance of retrieved sociology document chunks to a question.\n"
                "List ONLY the numbers of the chunks containing relevant information to answer the question.\n"
                "Format: Comma-separated numbers (e.g., '1, 3') or 'none' if none are relevant. No other text.",
            ),
            ("human", "Question: {question}\n\n{chunks}"),
        ]
    )
    grader = prompt | llm | StrOutputParser()

    try:
        result = grader.invoke({"question": question, "chunks": formatted_chunks})
        logger.info("[Grade] Relevance output: '%s'", result.strip())

        filtered = []
        if "none" not in result.lower():
            for i, d in enumerate(documents, 1):
                if str(i) in result:
                    filtered.append(d)

        if not filtered and len(documents) > 0 and "none" not in result.lower():
            filtered = documents[:2]
    except Exception as e:
        logger.warning("[Grade] Evaluation error: %s (keeping chunks)", e)
        filtered = documents

    logger.info(
        "[Grade] Evaluated %d chunk(s): %d relevant, %d discarded",
        len(documents),
        len(filtered),
        len(documents) - len(filtered),
    )

    needs_web_search = len(filtered) == 0
    return {"documents": filtered, "web_search": needs_web_search}


def decide_to_retrieve_or_web_search(state: GraphState):
    """
    Routes to web search or answer generation.
    """
    if state.get("web_search", False):
        logger.info("[Route] Insufficient context -> web_search")
        return "web_search"
    else:
        logger.info("[Route] Sufficient context -> generate")
        return "generate"


def web_search(state: GraphState):
    """
    Performs web search via DuckDuckGo when vector context is insufficient.
    """
    question = state.get("question", "").strip()
    documents = list(state.get("documents", []))
    retry_count = state.get("retry_count", 0)

    if not question:
        logger.warning("[WebSearch] Empty question; skipping search")
        return {"documents": documents, "web_search": False, "retry_count": retry_count + 1}

    search_query = f"{question} sociology" if "sociology" not in question.lower() else question
    logger.info("[WebSearch] Querying: '%s'", search_query)

    try:
        raw_results = web_search_tool.invoke(search_query)
        snippets = []

        if isinstance(raw_results, list):
            for item in raw_results:
                if isinstance(item, dict):
                    snip = item.get("snippet") or item.get("body") or item.get("title", "")
                    if snip:
                        snippets.append(snip)
                elif isinstance(item, str) and item.strip():
                    snippets.append(item.strip())
        elif isinstance(raw_results, str) and raw_results.strip():
            snippets.append(raw_results.strip())

        if snippets:
            combined = "\n\n".join(snippets[:4])
            documents.append(Document(page_content=combined, metadata={"source": "duckduckgo"}))
            logger.info("[WebSearch] Retrieved %d snippet(s)", len(snippets))
        else:
            logger.warning("[WebSearch] 0 snippets returned")
    except Exception as e:
        logger.error("[WebSearch] Search error: %s", e)

    return {"documents": documents, "web_search": False, "retry_count": retry_count + 1}


def generate(state: GraphState):
    """
    Synthesizes a structured, concise sociology explanation using context.
    """
    question = state.get("question", "")
    documents = state.get("documents", [])
    messages = list(state.get("messages", []))

    valid_chunks = [d.page_content.strip() for d in documents if d.page_content.strip()]
    logger.info("[Generate] Synthesizing answer with %d context document(s)", len(valid_chunks))

    if valid_chunks:
        context = "\n\n---\n\n".join(valid_chunks)
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are SocioPal, an expert sociology AI assistant.\n"
                    "Provide an articulate, accurate, and concise explanation (around 250-400 words).\n"
                    "Ground your answer in the provided context, highlighting theoretical definitions, foundational thinkers, and analytical distinctions.\n\n"
                    "Context:\n{context}",
                ),
                ("human", "{question}"),
            ]
        )
        chain = prompt | llm | StrOutputParser()
        generation = chain.invoke({"context": context, "question": question})
    else:
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are SocioPal, an expert sociology AI assistant.\n"
                    "Provide an articulate, accurate, and structured explanation (around 250-400 words).\n"
                    "Detail the core theoretical definitions, relevant thinkers, and sociological significance.",
                ),
                ("human", "{question}"),
            ]
        )
        chain = prompt | llm | StrOutputParser()
        generation = chain.invoke({"question": question})

    logger.info("[Generate] Answer generated (%d characters)", len(generation))
    messages.append(AIMessage(content=generation))
    return {"generation": generation, "messages": messages}


def grade_generation_v_documents_and_question(state: GraphState):
    """
    Assesses answer for grounding and question relevance in a single unified prompt.
    """
    question = state.get("question", "")
    documents = state.get("documents", [])
    generation = state.get("generation", "")
    retry_count = state.get("retry_count", 0)

    if retry_count >= 1:
        logger.info("[Verify] Max retry limit reached (retry_count=%d) -> finish", retry_count)
        return "finish"

    doc_content = "\n\n".join([d.page_content.strip() for d in documents if d.page_content.strip()])

    if not doc_content:
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Assess whether the generated answer directly addresses the sociology question.\n"
                    "Output only 'yes' if relevant, otherwise 'no'.",
                ),
                ("human", "Question: {question}\nAnswer: {generation}"),
            ]
        )
        grader = prompt | llm | StrOutputParser()
        try:
            resp = grader.invoke({"question": question, "generation": generation})
            is_relevant = "yes" in resp.strip().lower()
        except Exception:
            is_relevant = True
        logger.info("[Verify] Empty context -> Relevance: %s", "Pass" if is_relevant else "Fail")
        return "finish" if is_relevant else "re_attempt_web_search"

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an evaluator assessing a generated sociology answer against the provided context and question.\n"
                "Evaluate two criteria:\n"
                "1. Grounded: Is the answer consistent with and supported by the context without gross fabrication?\n"
                "2. Relevant: Does the answer directly address the user's question?\n\n"
                "Respond in this exact format:\n"
                "Grounded: yes/no\n"
                "Relevant: yes/no",
            ),
            ("human", "Question: {question}\n\nContext:\n{context}\n\nAnswer:\n{generation}"),
        ]
    )
    verifier = prompt | llm | StrOutputParser()

    try:
        verdict = verifier.invoke(
            {
                "question": question,
                "context": doc_content[:2000],
                "generation": generation[:2000],
            }
        )
        is_grounded = "grounded: yes" in verdict.lower() or "grounded:yes" in verdict.lower()
        is_relevant = "relevant: yes" in verdict.lower() or "relevant:yes" in verdict.lower()
    except Exception as e:
        logger.warning("[Verify] Verification error: %s (defaulting to Pass)", e)
        is_grounded = True
        is_relevant = True

    logger.info(
        "[Verify] Grounded: %s | Relevant: %s",
        "Yes" if is_grounded else "No",
        "Yes" if is_relevant else "No",
    )

    if is_grounded and is_relevant:
        logger.info("[Decision] Verification passed -> finish")
        return "finish"
    else:
        logger.info("[Decision] Verification failed -> re_attempt_web_search")
        return "re_attempt_web_search"
