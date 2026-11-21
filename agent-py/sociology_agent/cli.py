import os
from langchain_core.messages import HumanMessage

from .agent import graph
from .config import PERSIST_DIRECTORY, logger


def run_agent():
    """
    Main function to run the LangGraph RAG agent.
    """
    if not os.path.exists(PERSIST_DIRECTORY):
        logger.error("Chroma DB directory '%s' not found.", PERSIST_DIRECTORY)
        logger.info("Please run 'uv run python -m sociology_agent.index' to create the vector database.")
        return

    app = graph
    print("LangGraph RAG Agent built successfully.")

    print("\n--- Running Agent ---")
    user_question = "What is Sociology of literature, film, and art?"
    print(f"Question: {user_question}")

    final_state = app.invoke(
        {
            "question": user_question,
            "documents": [],
            "generation": "",
            "web_search": False,
            "retry_count": 0,
            "messages": [],
        },
        config={"configurable": {"thread_id": "1"}},
    )

    print("\n--- Final Answer ---")
    print(final_state["generation"])

    print("\n--- Running another example (potentially triggering web search) ---")
    user_question_2 = "What is the capital of France?"
    print(f"Question: {user_question_2}")

    final_state_2 = app.invoke(
        {
            "question": user_question_2,
            "documents": [],
            "generation": "",
            "web_search": False,
            "retry_count": 0,
            "messages": [],
        },
        config={"configurable": {"thread_id": "2"}},
    )
    print("\n--- Final Answer ---")
    print(final_state_2["generation"])


def run_cli_agent():
    """
    Main function to run the LangGraph RAG agent as an interactive CLI.
    """
    if not os.path.exists(PERSIST_DIRECTORY):
        logger.error("Chroma DB directory '%s' not found.", PERSIST_DIRECTORY)
        logger.info("Please run 'uv run python -m sociology_agent.index' to create the vector database.")
        return

    app = graph
    print("LangGraph RAG Agent built successfully. Type 'exit' to quit.")
    print("----------------------------------------------------------")

    messages = []
    thread_id_counter = 1

    while True:
        user_question = input("\nEnter your question (or 'exit' to quit): ").strip()

        if user_question.lower() == "exit":
            print("Exiting Q&A application. Goodbye!")
            break

        if not user_question:
            print("Please enter a question.")
            continue

        messages.append(HumanMessage(content=user_question))
        logger.info("[CLI] Processing question: '%s'...", user_question)

        try:
            final_state = app.invoke(
                {
                    "question": user_question,
                    "documents": [],
                    "generation": "",
                    "web_search": False,
                    "retry_count": 0,
                    "messages": messages,
                },
                config={"configurable": {"thread_id": str(thread_id_counter)}},
            )

            print("\n--- Answer ---")
            print(final_state["generation"])
            print("----------------------------------------------------------")

            thread_id_counter += 1

        except Exception as e:
            logger.error("[CLI] Processing error: %s", e)
            print("Please try again or check your environment setup.")


if __name__ == "__main__":
    run_cli_agent()
