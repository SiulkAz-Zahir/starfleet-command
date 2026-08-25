# Prompt engineering notes

This documents the reasoning behind `backend/prompts.py`, so the prompt
isn't just something that "happens to work" — you can see the decisions
and apply the same ones elsewhere.

## The four things a working prompt usually has

1. **Role** — who is the model supposed to be acting as, right now?
2. **Task** — what, specifically, should it do with the next message?
3. **Constraints** — what should it NOT do (length, tone, format)?
4. **Output format** — how should the response be structured so your code
   can use it without guessing?

`SYSTEM_PROMPT` in `backend/prompts.py` has all four, in that order, and
nothing else. That's deliberate — every extra sentence in a system prompt
is tokens spent on every single call, forever, whether or not it changes
the output.

## Why JSON output specifically

The frontend needs `reply` (text to show) and `pointers` (links to show)
as separate fields — not one blob of prose it has to parse with string
matching. Asking the model to return structured JSON turns "hope the
format is consistent" into "the field either exists or it doesn't,"
which is why `llm.py` can safely do `data.get("reply", raw)` — a
guaranteed fallback instead of a crash if the model ever slips.

## Token-budget decisions, made concrete

- **The system prompt is ~120 tokens**, not 800. Long, over-explained
  system prompts don't reliably produce better behavior past a certain
  point — they mostly cost money and latency on every call. Start short,
  and only add a sentence when you have a concrete failure it fixes.
- **`build_user_message()` sends the current command plus a short
  trailing context — never the full app state.** The temptation is to
  dump everything (all roadmap data, all logs) into every call "just in
  case it's useful." Don't. Send what the specific question needs.
- **The router in `main.py` skips the LLM entirely for known commands**
  (`/help`). Calling an LLM to answer a question a plain `if` statement
  can answer is the single most common prompt-engineering-adjacent
  mistake — not a bad prompt, but reaching for a model when you didn't
  need one.

## Before / after (a real example, not hypothetical)

**Before** (what a first draft usually looks like):
> "You are a helpful and friendly AI tutor for a Star Trek themed learning
> app. Please help the user understand programming and cybersecurity
> concepts related to their studies. Be encouraging and supportive, use a
> conversational tone, and try to make Star Trek references when
> relevant. If they ask a question, do your best to explain it clearly
> and thoroughly so they really understand the concept and don't just
> get the answer without learning..."

Problems: no output format (the frontend would have to guess how to
parse free text), no length constraint (costs scale with verbosity), and
"Star Trek references when relevant" burns tokens steering tone instead
of steering pedagogy.

**After** — what's actually in `prompts.py`: role, one behavioral rule
that matters (don't just answer), a length cap, and a strict output
schema. Shorter, cheaper per call, and easier for the code that consumes
it to trust.

## Where to go deeper

- Anthropic's own prompt engineering docs (the vendor of the model this
  project was scaffolded with):
  https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
- Vendor-neutral, free, comprehensive: https://www.promptingguide.ai/
