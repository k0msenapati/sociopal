from typing import List, TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from langchain.schema import Document


class GraphState(TypedDict):
    """
    Represents the state of our graph.

    Attributes:
        question: The user's question.
        documents: List of retrieved documents.
        generation: The generated answer.
        web_search: Whether a web search was performed.
        messages: List of chat messages (HumanMessage, AIMessage).
    """

    question: str
    documents: List[Document]
    generation: str
    web_search: bool
    messages: Annotated[List[BaseMessage], add_messages]
