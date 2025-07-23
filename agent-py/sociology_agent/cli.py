import os

from .agent import graph
from .config import PERSIST_DIRECTORY


def run_agent():
    """
    Main function to run the LangGraph RAG agent.
    """
    if not os.path.exists(PERSIST_DIRECTORY):
        print(f"Error: Chroma DB directory '{PERSIST_DIRECTORY}' not found.")
        print(
            "Please run 'uv run scripts/index.py' first to create the vector database."
        )
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
        print(f"Error: Chroma DB directory '{PERSIST_DIRECTORY}' not found.")
        print("Please run 'python index.py' first to create the vector database.")
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

        print(f"\nProcessing question: '{user_question}'...")

        try:
            final_state = app.invoke(
                {
                    "question": user_question,
                    "documents": [],
                    "generation": "",
                    "web_search": False,
                    "messages": messages,
                },
                config={"configurable": {"thread_id": str(thread_id_counter)}},
            )

            print("\n--- Answer ---")
            print(final_state["generation"])
            print("----------------------------------------------------------")

            thread_id_counter += 1

        except Exception as e:
            print(f"An error occurred while processing your question: {e}")
            print("Please try again or check your environment setup.")


if __name__ == "__main__":
    run_cli_agent()
