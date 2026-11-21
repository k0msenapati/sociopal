from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import GraphState
from .nodes import (
    retrieve,
    grade_documents,
    decide_to_retrieve_or_web_search,
    web_search,
    generate,
    grade_generation_v_documents_and_question,
)


workflow = StateGraph(GraphState)

workflow.add_node("retrieve", retrieve)
workflow.add_node("grade_documents", grade_documents)
workflow.add_node("web_search", web_search)
workflow.add_node("generate", generate)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "grade_documents")
workflow.add_conditional_edges(
    "grade_documents",
    decide_to_retrieve_or_web_search,
    {
        "web_search": "web_search",
        "generate": "generate",
    },
)
workflow.add_edge("web_search", "generate")
workflow.add_conditional_edges(
    "generate",
    grade_generation_v_documents_and_question,
    {
        "re_attempt_web_search": "web_search",
        "finish": END,
    },
)

graph = workflow.compile(checkpointer=MemorySaver())
