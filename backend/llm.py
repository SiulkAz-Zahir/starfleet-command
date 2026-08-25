"""
One function, two possible backends. The route handler in main.py
never needs to know or care which one is active — that's the whole
point of putting this behind a single call_llm() function instead
of branching on provider inside main.py.

LLM_PROVIDER=ollama    -> free, runs on your machine, no API key
LLM_PROVIDER=anthropic -> costs money per call, needs ANTHROPIC_API_KEY
"""

import json
import os

import httpx

from prompts import SYSTEM_PROMPT, build_user_message

PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")


async def call_llm(command_text: str, recent_context: str = "") -> dict:
    user_message = build_user_message(command_text, recent_context)

    if PROVIDER == "anthropic":
        return await _call_anthropic(user_message)
    return await _call_ollama(user_message)


async def _call_ollama(user_message: str) -> dict:
    """
    Ollama's /api/chat speaks OpenAI-ish JSON over plain HTTP to
    localhost — no key, no billing, runs entirely on your machine.
    Install: https://ollama.com, then `ollama pull qwen2.5:7b`
    (or any model — see README for hardware-appropriate picks).
    """
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "format": "json",
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        content = resp.json()["message"]["content"]
    return _safe_parse(content)


async def _call_anthropic(user_message: str) -> dict:
    """
    Optional, off by default. Only used if you set
    LLM_PROVIDER=anthropic and provide your own ANTHROPIC_API_KEY —
    this will incur normal API costs, unlike the Ollama path.
    """
    import anthropic  # imported lazily so the package is optional

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )
    return _safe_parse(msg.content[0].text)


def _safe_parse(raw: str) -> dict:
    try:
        data = json.loads(raw)
        return {"reply": data.get("reply", raw), "pointers": data.get("pointers", [])}
    except json.JSONDecodeError:
        # Model didn't return clean JSON — degrade gracefully instead of 500ing.
        return {"reply": raw.strip(), "pointers": []}
