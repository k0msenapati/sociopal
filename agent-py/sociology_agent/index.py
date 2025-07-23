from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores import Chroma

from sociology_agent.config import PERSIST_DIRECTORY


def create_vector_db(
    url: str = "https://www.wikiwand.com/en/articles/Sociology",
    persist_directory: str = PERSIST_DIRECTORY,
):
    """
    Creates a vector db from the content of a given URL and persists it.

    Args:
        url (str): The URL to load content from.
        persist_directory (str): The directory to save the Chroma DB.
    """
    print(f"Loading content from URL: {url}...")
    try:
        loader = WebBaseLoader(url)
        docs = loader.load()
        print(f"Loaded {len(docs)} document(s).")

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200, add_start_index=True
        )
        splits = text_splitter.split_documents(docs)
        print(f"Split into {len(splits)} chunks.")

        embeddings = FastEmbedEmbeddings()

        print(f"Creating Chroma DB and persisting to {persist_directory}...")
        vectorstore = Chroma.from_documents(
            documents=splits, embedding=embeddings, persist_directory=persist_directory
        )
        print("Chroma DB created and persisted successfully.")
        return vectorstore
    except Exception as e:
        print(f"An error occurred during vector DB creation: {e}")
        return None


if __name__ == "__main__":
    create_vector_db()
    print("Vector DB creation script executed.")
