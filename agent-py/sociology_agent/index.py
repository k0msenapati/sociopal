import os

os.environ["ANONYMIZED_TELEMETRY"] = "False"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0"
os.environ["USER_AGENT"] = USER_AGENT

import re
import json
import shutil
import urllib.parse
import argparse
import requests
from langchain.schema import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import WebBaseLoader

from sociology_agent.config import PERSIST_DIRECTORY, BASE_DIR, embeddings, logger


DEFAULT_WIKIPEDIA_TOPICS = [
    "Sociology",
    "Sociological theory",
    "Karl Marx",
    "Émile Durkheim",
    "Max Weber",
    "Social stratification",
    "Structural functionalism",
    "Symbolic interactionism",
    "Conflict theories",
    "Pierre Bourdieu",
    "Michel Foucault",
]

DATA_DIR = os.path.join(BASE_DIR, "data")
DEFAULT_CACHE_FILE = os.path.join(DATA_DIR, "wikipedia_corpus.json")
WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"


def clean_article_text(text: str) -> str:
    """
    Strips trailing bibliography, references, and external link sections from Wikipedia extracts.
    """
    stop_markers = [
        "\n== See also ==",
        "\n== References ==",
        "\n== Further reading ==",
        "\n== External links ==",
        "\n== Notes ==",
        "\n== Works ==",
        "\n== Selected bibliography ==",
    ]
    earliest_idx = len(text)
    for marker in stop_markers:
        idx = text.find(marker)
        if idx != -1 and idx < earliest_idx:
            earliest_idx = idx

    return text[:earliest_idx].strip()


def extract_topic_from_url(url: str) -> tuple[str, bool]:
    """
    Determines if a URL is a Wikipedia article and extracts the topic title.
    Returns (topic_or_url, is_wikipedia).
    """
    if "wikipedia.org/wiki/" in url:
        topic_part = url.split("wikipedia.org/wiki/")[-1].split("#")[0].split("?")[0]
        decoded = urllib.parse.unquote(topic_part).replace("_", " ")
        return decoded, True
    return url, False


def fetch_wikipedia_article(topic: str, session: requests.Session | None = None) -> Document | None:
    """
    Fetches full clean plaintext for a Wikipedia article using the MediaWiki API.
    """
    client = session or requests.Session()
    params = {
        "action": "query",
        "prop": "extracts",
        "explaintext": "1",
        "titles": topic,
        "format": "json",
        "redirects": "1",
    }
    headers = {"User-Agent": USER_AGENT}

    try:
        resp = client.get(WIKIPEDIA_API_URL, params=params, headers=headers, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        pages = data.get("query", {}).get("pages", {})
        if not pages:
            logger.warning("[Index] No pages found for topic: %s", topic)
            return None

        page = next(iter(pages.values()))
        resolved_title = page.get("title", topic)
        raw_text = page.get("extract", "")

        if not raw_text:
            logger.warning("[Index] Empty extract returned for Wikipedia topic: %s", topic)
            return None

        cleaned_text = clean_article_text(raw_text)
        wiki_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(resolved_title.replace(' ', '_'))}"

        return Document(
            page_content=cleaned_text,
            metadata={
                "title": resolved_title,
                "source": wiki_url,
                "topic": topic,
                "source_type": "wikipedia",
            },
        )
    except Exception as e:
        logger.error("[Index] Failed to fetch Wikipedia topic '%s': %s", topic, e)
        return None


def fetch_web_page(url: str) -> Document | None:
    """
    Fetches open web resources using WebBaseLoader for non-Wikipedia URLs.
    """
    try:
        loader = WebBaseLoader(url, header_template={"User-Agent": USER_AGENT})
        docs = loader.load()
        if docs:
            combined_text = "\n\n".join([d.page_content.strip() for d in docs if d.page_content.strip()])
            return Document(
                page_content=combined_text,
                metadata={
                    "title": docs[0].metadata.get("title", url),
                    "source": url,
                    "topic": url,
                    "source_type": "web",
                },
            )
    except Exception as e:
        logger.error("[Index] Failed to fetch web URL '%s': %s", url, e)
    return None


def load_documents(
    sources: list[str] | None = None,
    force_download: bool = False,
    cache_path: str = DEFAULT_CACHE_FILE,
) -> list[Document]:
    """
    Loads documents from Wikipedia (or web URLs), utilizing the local JSON corpus cache if available.
    """
    # If using default topics and cache file exists and not forced, load from disk
    if sources is None and os.path.exists(cache_path) and not force_download:
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_items = json.load(f)
            docs = []
            for item in cached_items:
                cleaned = clean_article_text(item.get("content", ""))
                docs.append(
                    Document(
                        page_content=cleaned,
                        metadata={
                            "title": item.get("title", "Sociology"),
                            "source": item.get("url", "https://en.wikipedia.org/wiki/Sociology"),
                            "topic": item.get("topic", "Sociology"),
                            "source_type": "wikipedia",
                        },
                    )
                )
            logger.info("[Index] Loaded %d Wikipedia article(s) from local cache (%s)", len(docs), cache_path)
            return docs
        except Exception as e:
            logger.warning("[Index] Could not read cache file %s (%s); downloading fresh...", cache_path, e)

    target_sources = sources if sources is not None else DEFAULT_WIKIPEDIA_TOPICS
    logger.info("[Index] Downloading content for %d topic(s) / source(s)...", len(target_sources))

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    documents: list[Document] = []
    saved_cache_items: list[dict] = []

    for src in target_sources:
        src = src.strip()
        if not src:
            continue

        if src.startswith("http://") or src.startswith("https://"):
            topic, is_wiki = extract_topic_from_url(src)
            if is_wiki:
                doc = fetch_wikipedia_article(topic, session=session)
            else:
                doc = fetch_web_page(src)
        else:
            doc = fetch_wikipedia_article(src, session=session)

        if doc and doc.page_content:
            documents.append(doc)
            saved_cache_items.append(
                {
                    "title": doc.metadata.get("title", src),
                    "url": doc.metadata.get("source", src),
                    "topic": src,
                    "content": doc.page_content,
                    "length": len(doc.page_content),
                }
            )
            logger.info("  ✓ [Index] Loaded '%s' (%d chars)", doc.metadata.get("title", src), len(doc.page_content))

    # Cache if default set was downloaded
    if sources is None and saved_cache_items:
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(saved_cache_items, f, indent=2, ensure_ascii=False)
            logger.info("[Index] Cached %d Wikipedia article(s) to %s", len(saved_cache_items), cache_path)
        except Exception as e:
            logger.warning("[Index] Failed to save cache to %s: %s", cache_path, e)

    return documents


def create_vector_db(
    sources: list[str] | None = None,
    persist_directory: str = PERSIST_DIRECTORY,
    force_download: bool = False,
):
    """
    Creates and persists the Chroma vector database using authentic Wikipedia articles and open resources.
    """
    logger.info("[Index] Initializing vector database creation at %s...", persist_directory)

    docs = load_documents(sources=sources, force_download=force_download)
    if not docs:
        logger.error("[Index] No documents available to index.")
        return None

    try:
        if os.path.exists(persist_directory):
            logger.info("[Index] Removing existing database at %s", persist_directory)
            shutil.rmtree(persist_directory)

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            add_start_index=True,
        )
        splits = text_splitter.split_documents(docs)
        logger.info("[Index] Split %d document(s) into %d chunks", len(docs), len(splits))

        logger.info("[Index] Embedding and indexing %d chunks with FastEmbed...", len(splits))
        vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=persist_directory,
        )
        logger.info(
            "[Index] ChromaDB successfully created and persisted with %d chunks at %s",
            len(splits),
            persist_directory,
        )
        return vectorstore
    except Exception as e:
        logger.error("[Index] Failed to create vector database: %s", e)
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index Wikipedia articles and free open resources into ChromaDB")
    parser.add_argument("--topics", nargs="+", help="Specific Wikipedia topics to index")
    parser.add_argument("--url", action="append", help="Specific URLs to index (can be specified multiple times)")
    parser.add_argument("--force-download", action="store_true", help="Force re-downloading articles even if cached")
    args = parser.parse_args()

    sources_to_index = None
    if args.topics or args.url:
        sources_to_index = []
        if args.topics:
            sources_to_index.extend(args.topics)
        if args.url:
            sources_to_index.extend(args.url)

    create_vector_db(sources=sources_to_index, force_download=args.force_download)
