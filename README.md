# Starfleet Command Console

A personal roadmap / tutor / research console. Part progress tracker, part
Socratic tutor, part auto-updating resource feed. Built to be learned from,
not just used — see `ARCHITECTURE.md` and `PROMPT_ENGINEERING.md` for the
reasoning behind every structural decision.

Two ways to run it:

- **Away Mission Mode** — the static frontend alone. Free forever on
  GitHub Pages. No backend, no LLM, no cost.
- **Bridge Mode** — the frontend + a local Python backend, optionally
  talking to a free local LLM (via Ollama). Full tutor console. Runs on
  your machine.

Read `ARCHITECTURE.md` first — it explains why these are two separate
things and can't just always be merged into one.

---

## 1. Run it locally in VS Code (Away Mission Mode)

You don't need the backend to try the app.

1. Open the project folder in VS Code.
2. Install the **Live Server** extension (or any static file server).
3. Right-click `frontend/index.html` → "Open with Live Server"
   (or from a terminal: `cd frontend && python -m http.server 8080`,
   then open `http://localhost:8080`).
4. You should see "AWAY MISSION MODE" in the Assistant tab. That's
   expected — no backend is running yet.

## 2. Add Bridge Mode (real LLM tutor, still free)

1. **Install Ollama** (free, open-source, runs models locally):
   https://ollama.com
2. Pull a model sized to your machine:
   ```bash
   # Lighter machines (8GB RAM):
   ollama pull qwen2.5:7b
   # or even lighter:
   ollama pull llama3.2:3b
   ```
   If you have more RAM/VRAM, larger models will reason better — see
   `OLLAMA_MODEL` in `backend/.env.example`. This isn't a fixed
   recommendation forever; check https://ollama.com/library for what's
   current when you set this up.
3. Set up the backend:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate      # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   uvicorn main:app --reload
   ```
4. Visit `http://localhost:8000/docs` — FastAPI's auto-generated docs.
   Try the `/api/command` route directly from there before touching the
   frontend, so you know the backend works in isolation.
5. Reload the frontend (must still be served locally, not from GitHub
   Pages — see the mixed-content section in `ARCHITECTURE.md`). The
   badge should now read "BRIDGE MODE."

If you'd rather use a hosted API (Claude, GPT, etc.) instead of a local
model, set `LLM_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` in `.env` —
but note this costs money per call, unlike Ollama.

## 3. Deploy the free permanent version to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/starfleet-command.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source → Deploy from a branch →
main, /frontend**. Your console will be live at
`https://<your-username>.github.io/starfleet-command/` within a minute or
two. This will always run in Away Mission Mode (see `ARCHITECTURE.md` for
why) — that's expected and fine.

## 4. Turn on the automatic resource refresh

The workflow in `.github/workflows/refresh-resources.yml` runs
`scripts/refresh_resources.py` daily, for free, on GitHub's hosted
runners, and commits the result. Nothing to configure — it starts working
the moment you push. To run it once yourself first (so `resources.json`
isn't empty on day one):

```bash
pip install -r scripts/requirements.txt
python scripts/refresh_resources.py
git add frontend/data/resources.json
git commit -m "Seed resources"
git push
```

---

## Learning resources

Organized by what you asked for. All free unless marked otherwise.

### Python fundamentals, taught properly (not vibe-coded)
- **CS50P** — Harvard's free "Introduction to Programming with Python":
  https://cs50.harvard.edu/python/
- **Official Python tutorial** (the primary source, worth reading start
  to end once): https://docs.python.org/3/tutorial/
- **Automate the Boring Stuff with Python** (free to read online):
  https://automatetheboringstuff.com/
- **Real Python** — deep, well-written tutorials, many free:
  https://realpython.com/

### Software architecture and design
- **The Twelve-Factor App** — short, foundational, free:
  https://12factor.net/
- **Refactoring Guru** — design patterns explained with diagrams, free:
  https://refactoring.guru/design-patterns
- **FastAPI's official tutorial** — doubles as a well-written intro to
  API design in general: https://fastapi.tiangolo.com/tutorial/
- *A Philosophy of Software Design* (John Ousterhout) — not free, but
  short and widely regarded as one of the clearest books on the "how do
  I structure this" question specifically.

### Prompt engineering
- **Anthropic's prompt engineering docs** (matches the model this
  project was scaffolded with):
  https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
- **promptingguide.ai** — vendor-neutral, comprehensive, free:
  https://www.promptingguide.ai/
- See `PROMPT_ENGINEERING.md` in this repo for how those principles were
  actually applied to `backend/prompts.py`.

### AI-assisted programming (the "not vibe coding" version)
The goal is a tool that explains itself, not one that writes code you
can't defend in a review. A few that support that workflow:
- **Claude** (claude.ai / this conversation) — ask it to explain its
  reasoning before accepting a suggestion; you can literally paste this
  README back and ask "why did you structure the JS this way" and get a
  real answer.
- **Ollama** + **Continue.dev** — a free, open-source VS Code extension
  that pairs with a local model (via Ollama) for inline suggestions,
  fully offline: https://ollama.com · https://continue.dev/
- **GitHub Copilot** — has a free tier with monthly limits; check current
  terms at https://github.com/features/copilot, since free-tier details
  change over time.

The habit that matters more than any specific tool: **ask "why" before
you accept a suggestion.** If you can't explain a piece of code someone
(or something) gave you, don't merge it yet.

### Git & GitHub
- **Official Git docs**: https://git-scm.com/doc
- **GitHub Docs — GitHub Pages**: https://docs.github.com/en/pages
- **GitHub Docs — Actions**: https://docs.github.com/en/actions

---

## Project layout

```
starfleet-command/
├── frontend/          static site — deploy this folder to GitHub Pages
│   ├── index.html
│   ├── css/lcars.css
│   ├── js/            one small module per feature (see ARCHITECTURE.md)
│   └── data/           roadmap.json, knowledge.json, resources.json
├── backend/           FastAPI app — run locally for Bridge Mode
├── scripts/           refresh_resources.py — run manually or via Actions
└── .github/workflows/  the free scheduled job
```

## What to build next, yourself

1. Add a `quiz.js` and `skills.js` module, following the same one-file-
   one-job pattern as the rest of `frontend/js/` (your uploaded reference
   file has a working version of both to study, in its single-file form —
   the exercise is re-structuring that logic into this project's module
   pattern, not inventing it from scratch).
2. Add a keyword or two of your own to `frontend/data/knowledge.json`
   next time the Assistant tab tells you it doesn't have a match.
3. Once Bridge Mode feels solid, try swapping `OLLAMA_MODEL` for a
   coding-specialized model and compare answer quality.
