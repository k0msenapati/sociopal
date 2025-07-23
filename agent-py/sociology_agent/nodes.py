from langchain.schema import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage

from .config import llm, web_search_tool, retriever
from .state import GraphState


def retrieve(state: GraphState):
    """
    Retrieves documents from the vector store based on the question.
    """
    print("---RETRIEVE---")

    chat_history = state.get("chat_history", [])
    question = ""
    if chat_history:
        for msg in reversed(chat_history):
            if isinstance(msg, HumanMessage):
                question = str(msg.content)
                break

    if not question:
        question = state.get("question", "")

    if not question:
        print("No question found in state or chat history. Skipping retrieval.")
        return {"documents": [], "web_search": False, "question": ""}

    if retriever is None:
        print("Retriever not initialized. Skipping retrieval.")
        return {"documents": [], "web_search": False}

    documents = retriever.invoke(question)
    print(f"Retrieved {len(documents)} documents.")
    return {"documents": documents, "web_search": False}


def grade_documents(state: GraphState):
    """
    Grades the relevance of the retrieved documents to the question.
    If documents are not relevant, triggers a web search.
    """
    print("---GRADE DOCUMENTS---")
    question = state["question"]
    documents = state["documents"]

    if not documents:
        print("No documents to grade. Proceeding to web search.")
        return {"documents": [], "web_search": True}

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a grader assessing the relevance of a retrieved document to a user question.
        If the document contains information directly relevant to the question, output 'yes'.
        Otherwise, output 'no'. Do not provide any other explanation.""",
            ),
            ("human", "Question: {question}\nDocument: {document}"),
        ]
    )
    retrieval_grader = prompt | llm | StrOutputParser()

    filtered_documents = []
    for d in documents:
        score = retrieval_grader.invoke(
            {"question": question, "document": d.page_content}
        )
        if score.strip().lower() == "yes":
            print(f"Document relevant: {d.page_content[:100]}...")
            filtered_documents.append(d)
        else:
            print(f"Document NOT relevant: {d.page_content[:100]}...")

    if not filtered_documents:
        print("No relevant documents found. Initiating web search.")
        return {"documents": [], "web_search": True}
    else:
        print(f"Found {len(filtered_documents)} relevant documents.")
        return {"documents": filtered_documents, "web_search": False}


def generate(state: GraphState):
    """
    Generates an answer based on the question and retrieved documents.
    """
    print("---GENERATE---")
    question = state["question"]
    documents = state["documents"]
    messages = state["messages"]

    context = "\n\n".join([d.page_content for d in documents])

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an AI assistant for question-answering tasks.
        Use the following retrieved context to answer the question.
        If you don't know the answer, state that you don't know.
        Provide a concise and accurate answer.
        Context: {context}""",
            ),
            ("human", "Question: {question}"),
        ]
    )

    rag_chain = prompt | llm | StrOutputParser()

    generation = rag_chain.invoke({"context": context, "question": question})
    print(f"Generated answer: {generation[:100]}...")

    messages.append(AIMessage(content=generation))
    return {"generation": generation, "messages": messages}


def web_search(state: GraphState):
    """
    Performs a web search based on the question.
    This is typically called when initial retrieval fails or documents are not relevant.
    """
    print("---WEB SEARCH---")
    question = state["question"]
    documents = state["documents"]

    if not question or question.strip() == "":
        print("Web search skipped: Question is empty.")
        return {"documents": [], "web_search": True}

    print(f"Performing web search for: {question}")
    docs = web_search_tool.invoke(question)
    web_results = "\n".join([d["snippet"] for d in docs])
    web_results = Document(page_content=web_results)
    print(f"Web search retrieved {len(docs)} results.")

    documents.append(web_results)
    return {"documents": documents, "web_search": True}


def grade_generation_v_documents_and_question(state: GraphState):
    """
    Grades the generated answer against the retrieved documents and the original question
    to check for hallucination and grounding.
    """
    print("---GRADE GENERATION---")
    question = state["question"]
    documents = state["documents"]
    generation = state["generation"]

    hallucination_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a grader assessing if an answer is grounded in a document.
        If the answer is directly supported by the document, output 'yes'.
        Otherwise, output 'no'. Do not provide any other explanation.""",
            ),
            ("human", "Document: {document}\nAnswer: {generation}"),
        ]
    )
    hallucination_grader = hallucination_prompt | llm | StrOutputParser()

    relevance_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a grader assessing if an answer addresses the question.
        If the answer provides a direct and comprehensive response to the question, output 'yes'.
        Otherwise, output 'no'. Do not provide any other explanation.""",
            ),
            ("human", "Question: {question}\nAnswer: {generation}"),
        ]
    )
    relevance_grader = relevance_prompt | llm | StrOutputParser()

    doc_content = "\n\n".join([d.page_content for d in documents])
    hallucination_score = hallucination_grader.invoke(
        {"document": doc_content, "generation": generation}
    )
    is_hallucinated = hallucination_score.strip().lower() == "no"
    print(
        f"Hallucination check (grounded in docs): {'No' if is_hallucinated else 'Yes'}"
    )

    relevance_score = relevance_grader.invoke(
        {"question": question, "generation": generation}
    )
    is_relevant = relevance_score.strip().lower() == "yes"
    print(f"Relevance check (answers question): {'Yes' if is_relevant else 'No'}")

    if is_hallucinated:
        print(
            "Decision: Generated answer is hallucinated. Re-attempting with web search."
        )
        return "re_attempt_web_search"
    elif not is_relevant:
        print(
            "Decision: Generated answer is not relevant to the question. Re-attempting with web search."
        )
        return "re_attempt_web_search"
    else:
        print("Decision: Generated answer is grounded and relevant. FINISH.")
        return "finish"
