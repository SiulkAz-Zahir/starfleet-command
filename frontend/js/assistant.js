// assistant.js
//
// This is the "part assistant / part teacher" piece. It has two
// modes, and the whole point of this file is to make the mode
// switch explicit rather than magic:
//
//   AWAY MISSION MODE (default): no backend running. Commands are
//   matched against data/knowledge.json with plain keyword
//   scoring — no network calls, no LLM, works forever on GitHub
//   Pages for $0.
//
//   BRIDGE MODE: you're running the FastAPI backend locally
//   (see /backend). We detect it once at startup by hitting
//   /api/health, and if it answers, every command after that is
//   forwarded to the backend, which can call a real LLM (local via
//   Ollama, or an API you provide a key for).
//
// Read ARCHITECTURE.md for why this can't "just always" use the
// backend when the frontend is deployed on GitHub Pages.

const BACKEND_URL = "http://localhost:8000";
let bridgeAvailable = false;
let knowledgeBase = [];

export async function initAssistant() {
  const kb = await fetch("data/knowledge.json");
  knowledgeBase = await kb.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(1200) });
    bridgeAvailable = res.ok;
  } catch {
    bridgeAvailable = false;
  }

  const badge = document.getElementById("mode-badge");
  badge.textContent = bridgeAvailable ? "● BRIDGE MODE — local backend online" : "● AWAY MISSION MODE — static, offline tutor";
  badge.className = "mode-badge " + (bridgeAvailable ? "bridge" : "static");
}

export function wireAssistant() {
  const form = document.getElementById("console-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("console-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    appendEntry("user", text);
    const reply = bridgeAvailable ? await askBackend(text) : askStaticEngine(text);
    appendEntry("system", reply.text, reply.pointers);
  });
}

function appendEntry(role, text, pointers = []) {
  const log = document.getElementById("console-log");
  const div = document.createElement("div");
  div.className = `console-entry ${role}`;
  const pointerHtml = pointers
    .map((p) => `<a class="pointer" href="${p.url}" target="_blank" rel="noopener">→ ${p.label}</a>`)
    .join("");
  div.innerHTML = `<div>${escapeHtml(text)}</div>${pointerHtml}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- AWAY MISSION MODE: plain keyword scoring, no network, no LLM ----
function askStaticEngine(text) {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  let best = null;
  let bestScore = 0;
  for (const entry of knowledgeBase) {
    const score = entry.keywords.filter((k) => words.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (best) return { text: best.hint, pointers: best.pointers || [] };
  return {
    text:
      "No match in the offline knowledge base for that yet. Add an entry to data/knowledge.json, " +
      "or start the backend (cd backend && uvicorn main:app --reload) to unlock Bridge Mode's live tutor.",
    pointers: [],
  };
}

// ---- BRIDGE MODE: forward to the local FastAPI backend ----
async function askBackend(text) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const data = await res.json();
    return { text: data.reply, pointers: data.pointers || [] };
  } catch (err) {
    return { text: `Bridge Mode call failed (${err.message}). Falling back to static engine.`, pointers: [] };
  }
}
