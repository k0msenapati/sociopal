import os
import logging
import warnings

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=RuntimeWarning)

os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["USER_AGENT"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0"
for _noisy in ("urllib3", "httpx", "httpcore", "chromadb", "backoff", "primp"):
    logging.getLogger(_noisy).setLevel(logging.ERROR)

from fastembed import TextEmbedding
from langchain_core.embeddings import Embeddings
from langchain_groq import ChatGroq
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("sociopal.crag")

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PERSIST_DIRECTORY = os.getenv("PERSIST_DIRECTORY", os.path.join(BASE_DIR, "chroma_db"))

GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
llm = ChatGroq(model=GROQ_MODEL, temperature=0.2)


class FastEmbedLocalEmbeddings(Embeddings):
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5", cache_dir: str | None = None):
        if cache_dir is None:
            local_cache = os.path.join(BASE_DIR, ".fastembed_cache")
            if os.path.exists(local_cache):
                cache_dir = local_cache
            elif os.path.exists("/tmp/fastembed_cache"):
                cache_dir = "/tmp/fastembed_cache"
            else:
                cache_dir = None

        has_local = bool(cache_dir and os.path.exists(cache_dir))
        try:
            self.model = TextEmbedding(
                model_name=model_name,
                cache_dir=cache_dir,
                local_files_only=has_local,
            )
        except Exception as e:
            logger.warning("Local FastEmbed initialization fallback: %s", e)
            self.model = TextEmbedding(model_name=model_name, cache_dir=cache_dir)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [e.tolist() for e in self.model.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        return next(self.model.embed([text])).tolist()


embeddings = FastEmbedLocalEmbeddings()
web_search_tool = DuckDuckGoSearchResults(output_format="list")

_retriever = None


def get_retriever(force_reload: bool = False):
    global _retriever
    if _retriever is not None and not force_reload:
        return _retriever

    if os.path.exists(PERSIST_DIRECTORY):
        try:
            vectorstore = Chroma(
                persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings
            )
            _retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
            logger.info("ChromaDB vector store loaded from %s", PERSIST_DIRECTORY)
        except Exception as e:
            logger.error("Failed to load ChromaDB: %s", e)
            _retriever = None
    else:
        logger.warning(
            "ChromaDB directory '%s' not found. Vector retrieval will route to web search.",
            PERSIST_DIRECTORY,
        )
        _retriever = None

    return _retriever
