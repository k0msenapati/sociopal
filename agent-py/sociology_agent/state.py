from typing import List, TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from langchain.schema import Document


class GraphState(TypedDict):
    """
    State of the Corrective RAG (CRAG) workflow.

    Attributes:
        question: The user query.
        documents: Retrieved and filtered document chunks.
        generation: The generated answer.
        web_search: Flag indicating if web search should be or was performed.
        retry_count: Count of web search re-attempts to prevent infinite loops.
        messages: Conversation messages.
    """

    question: str
    documents: List[Document]
    generation: str
    web_search: bool
    retry_count: int
    messages: Annotated[List[BaseMessage], add_messages]
