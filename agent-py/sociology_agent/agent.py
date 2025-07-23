from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import GraphState
from .nodes import (
    retrieve,
    grade_documents,
    generate,
    web_search,
    grade_generation_v_documents_and_question,
)


def decide_to_retrieve_or_web_search(state: GraphState):
    """
    Determines whether to proceed with generation or perform a web search
    based on the document grading.
    """
    print("---DECIDE TO RETRIEVE OR WEB SEARCH---")
    if state["web_search"]:
        print(
            "Decision: Documents were not relevant or missing. Performing web search."
        )
        return "web_search"
    else:
        print("Decision: Relevant documents found. Generating answer.")
        return "generate"


workflow = StateGraph(GraphState)

workflow.add_node("retrieve", retrieve)
workflow.add_node("grade_documents", grade_documents)
workflow.add_node("generate", generate)
workflow.add_node("web_search", web_search)
workflow.add_node("grade_generation", grade_generation_v_documents_and_question)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "grade_documents")
workflow.add_conditional_edges(
    "grade_documents",
    decide_to_retrieve_or_web_search,
    {"web_search": "web_search", "generate": "generate"},
)
workflow.add_edge("web_search", "generate")
workflow.add_conditional_edges(
    "generate",
    grade_generation_v_documents_and_question,
    {"re_attempt_web_search": "web_search", "finish": END},
)

graph = workflow.compile(checkpointer=MemorySaver())
