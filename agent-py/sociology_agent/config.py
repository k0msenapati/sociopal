import os
from langchain_groq import ChatGroq
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

load_dotenv()

PERSIST_DIRECTORY = "./chroma_db"

llm = ChatGroq(model="gemma2-9b-it")
embeddings = FastEmbedEmbeddings()
web_search_tool = DuckDuckGoSearchResults(output_format="list")

retriever = None
try:
    if os.path.exists(PERSIST_DIRECTORY):
        vectorstore = Chroma(
            persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings
        )
        retriever = vectorstore.as_retriever()
        print(f"Retriever initialized from {PERSIST_DIRECTORY}")
    else:
        print(
            f"Warning: Chroma DB directory '{PERSIST_DIRECTORY}' not found. Retriever will be None."
        )
        print("Please run 'python index.py' first to create the vector database.")
except Exception as e:
    print(f"Error initializing retriever: {e}")
    retriever = None
