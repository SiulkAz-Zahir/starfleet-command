# Architecture

This document explains *why* the project is shaped this way, not just what
each file does. Read this before you start extending it.

## The constraint that drives everything

GitHub Pages (the free hosting) serves **static files only** — HTML, CSS,
JS. It cannot run Python, and it cannot keep a process alive to answer
requests. So anything that needs Python at request-time (calling an LLM,
hitting an API with a secret key, doing real-time computation) **cannot
live on GitHub Pages**. It has to either:

1. Run *before* deploy time and get baked into a static file the frontend
   reads (this is what the resources feed does), or
2. Run on a server you control, that the frontend calls over the network
   (this is what Bridge Mode does, but only when you're running that
   server yourself).

Every structural decision below is downstream of that one fact.

## Three layers

```
frontend/   →  pure static site. Works standalone, forever, for free,
               on GitHub Pages. Zero Python dependency.

backend/    →  FastAPI service. Only exists to answer requests in
               real time (the tutor console). You run this yourself,
               locally, when you want Bridge Mode. Not deployed to
               GitHub Pages — GitHub Pages can't run it.

scripts/    →  one-shot / scheduled Python jobs. Run by GitHub Actions
               (free, built into GitHub) on a timer, write their
               output into frontend/data/*.json, and then get out of
               the way. The frontend never talks to these directly —
               it only ever reads the JSON they produced.
```

## Data flow

```
   [ scripts/refresh_resources.py ]
             |  (runs daily via GitHub Actions — free)
             v
   [ frontend/data/resources.json ]  <-- committed to the repo
             |
             v
   [ frontend/js/resources.js ]  --renders-->  Resources tab

   -----------------------------------------------------------

   [ You, typing in the Assistant tab ]
             |
             v
   [ frontend/js/assistant.js ]
        checks: is a backend answering at localhost:8000?
             |                          |
        no (Away Mission)          yes (Bridge Mode)
             |                          |
   [ knowledge.json,          [ backend/main.py -> llm.py ->
     keyword match,             Ollama (free, local) or
     zero network calls ]       Anthropic API (paid, opt-in) ]
```

## Why the two-mode assistant, specifically

The "AI assistant that stays free" requirement and the "GitHub Pages
hosting" requirement pull in opposite directions — a real LLM needs a
server; free static hosting can't be a server. Rather than pick one, the
project supports both, and is honest in the UI about which one is active
(`mode-badge` in the Assistant tab). That's a real architecture pattern,
not a compromise: **graceful degradation** — the app is *always* usable,
and gets *better* when more infrastructure is available.

This also means: if you only ever deploy to GitHub Pages and never run
the backend, you still have a working, free, forever tutor — just a
simpler rule-based one. You are never required to pay for anything.

## The mixed-content gotcha (important, read this before you get stuck)

GitHub Pages serves your site over **HTTPS**. Your local backend, unless
you go out of your way to add a certificate, serves over plain **HTTP**.
Browsers block HTTPS pages from calling HTTP endpoints ("mixed content").

So: **Bridge Mode only works when the frontend is also served locally**,
not from the GitHub Pages URL. Practically:

- **Deployed on GitHub Pages** → Away Mission Mode only. This is fine —
  it's meant to be your permanent, always-available, zero-cost version.
- **Running locally** (`python -m http.server 8080` inside `frontend/`,
  or the VS Code "Live Server" extension) **+ backend running** → Bridge
  Mode, full tutor.

This is a genuine, common real-world constraint (not specific to this
project) — worth understanding on its own, since you'll hit it again in
any project that mixes a static frontend with a local API.

## Why FastAPI over Flask

Both would work. FastAPI was chosen because:
- Type hints are enforced at the boundary (Pydantic models), which
  catches "the frontend sent the wrong shape of JSON" bugs immediately
  instead of as a silent `KeyError` three functions later.
- Automatic interactive docs at `/docs` — open
  `http://localhost:8000/docs` while the backend is running and you can
  see and test every route without writing a single `curl` command.
- It's async-native, which matters here because every route either calls
  an LLM or an external API — both are I/O-bound waits, which async
  handles well.

If you'd rather learn Flask first because it has a gentler mental model,
that's a reasonable call too — the file layout here would barely change.

## Why the JS is split into six small modules instead of one file

The reference file you uploaded works, but it's ~1200 lines in one
`<script>` block, and every function can reach every piece of global
state. That's fine for a single evening's project; it stops being fine
the moment you want to change one feature without re-reading the whole
file to make sure you didn't break another.

The rule applied here: **each module owns one slice of state and one
part of the screen.** `state.js` is the only file that touches
`localStorage`. `roadmap.js` is the only file that knows the shape of
`roadmap.json`. `assistant.js` doesn't know the roadmap exists. If you
can point at a bug and know immediately which file it must be in, the
split is doing its job.

## What was deliberately left out (for you to build)

The reference file also had a quiz engine and a skill-tree with
dependency unlocking. Both are genuinely good features — they're left
out here on purpose, as the first real exercise: **follow the same
pattern** (one data file, one render function, one small module) to add
a `quiz.js` and `skills.js`. If you get stuck, that's exactly what the
Assistant tab is for.
