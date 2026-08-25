"""
Bridge Mode backend.

Run it with:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload

Then open frontend/index.html through a LOCAL server (not GitHub
Pages — see ARCHITECTURE.md for why) and the console will report
"BRIDGE MODE" instead of "AWAY MISSION MODE".
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import httpx

from llm import call_llm

app = FastAPI(title="Starfleet Command Backend")

# Locked to localhost origins on purpose — this backend is meant to
# stay on your machine, not become a public API. Widening this is a
# deliberate decision you'd make later, not a default.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class CommandIn(BaseModel):
    text: str
    context: str = ""


@app.get("/api/health")
async def health():
    return {"status": "online"}


@app.post("/api/command")
async def command(body: CommandIn):
    text = body.text.strip()

    # Router pattern: cheap, deterministic commands never touch the
    # LLM. Only ambiguous natural-language questions fall through to
    # call_llm(). This is the token-budget decision in practice —
    # see PROMPT_ENGINEERING.md.
    if text.lower() in ("/help", "help"):
        return {
            "reply": "Type a concept, error message, or topic you're stuck on. "
            "Slash commands: /help. Everything else goes to the tutor.",
            "pointers": [],
        }

    result = await call_llm(text, body.context)
    return result


@app.get("/api/search")
async def search(q: str):
    """
    Thin wrapper around DuckDuckGo's free Instant Answer API — no key
    required, but it only returns summary/definition-style results,
    not full web search. Good enough for quick lookups; swap in a
    paid search API later if you need real result pages.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.duckduckgo.com/",
            params={"q": q, "format": "json", "no_html": 1, "skip_disambig": 1},
        )
        data = resp.json()
    return {
        "query": q,
        "abstract": data.get("AbstractText", ""),
        "source": data.get("AbstractSource", ""),
        "url": data.get("AbstractURL", ""),
        "related": [t.get("Text") for t in data.get("RelatedTopics", [])[:5] if t.get("Text")],
    }
