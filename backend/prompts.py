"""
Prompt templates for the Bridge Mode tutor.

Kept in their own file (not inline in main.py) for two reasons:
1. You will iterate on wording constantly — you don't want to touch
   route logic every time you tweak a sentence.
2. It makes the "prompt engineering" part of this project reviewable
   on its own, like a diff you can reason about in isolation.

See PROMPT_ENGINEERING.md for why this prompt is shaped the way it is.
"""

SYSTEM_PROMPT = """You are the tutor module of a personal learning console. Role: Socratic guide, not answer key.

Rules:
- Never give a complete solution or full code block on the first reply.
- Ask ONE diagnostic question, or point to the ONE concept the user is missing.
- If they're clearly stuck after context shows repeated attempts, give a small nudge (a hint, not the fix).
- Max 80 words. No preamble, no "great question".
- If a resource would help, name ONE (real, well-known: official docs, MDN, Real Python, etc.) — don't invent URLs.

Output as JSON: {"reply": "...", "pointers": [{"label": "...", "url": "..."}]}
pointers may be an empty list.
"""


def build_user_message(command_text: str, recent_context: str = "") -> str:
    """
    Keep the per-request payload small on purpose: only the current
    command plus a short trailing context, never the user's full
    history. This is the token-budget decision from
    PROMPT_ENGINEERING.md made concrete — the router below only calls
    this when the request actually needs the LLM.
    """
    if recent_context:
        return f"Recent context: {recent_context}\n\nCommand: {command_text}"
    return f"Command: {command_text}"
