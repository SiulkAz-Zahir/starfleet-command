// log.js — Officer's Log entries and the study session timer.
// Two small, unrelated features that both just append to STATE
// arrays, so they share a file rather than getting one each.

import { STATE, addLog, addSession } from "./state.js";

export function renderLog() {
  const html = STATE.logs
    .map((entry) => {
      const d = new Date(entry.date);
      return `
        <div class="resource" style="border-left-color: var(--lcars-lilac)">
          <div class="meta">${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div style="white-space:pre-wrap;">${escapeHtml(entry.text)}</div>
        </div>`;
    })
    .join("");
  document.getElementById("log-entries").innerHTML =
    html || `<div class="empty">No log entries yet. Record today's stardate entry above.</div>`;
}

export function wireLog() {
  document.getElementById("log-submit").addEventListener("click", () => {
    const input = document.getElementById("log-input");
    const text = input.value.trim();
    if (!text) return;
    addLog(text);
    input.value = "";
    renderLog();
  });
}

function escapeHtml(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- Timer ----
let seconds = 0;
let interval = null;

function formatTime(s) {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export function wireTimer() {
  const display = document.getElementById("timer-display");
  const startBtn = document.getElementById("timer-start");
  const stopBtn = document.getElementById("timer-stop");

  startBtn.addEventListener("click", () => {
    if (interval) return;
    interval = setInterval(() => {
      seconds++;
      display.textContent = formatTime(seconds);
    }, 1000);
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener("click", () => {
    clearInterval(interval);
    interval = null;
    const minutes = Math.round(seconds / 60);
    if (minutes > 0) {
      const note = document.getElementById("timer-note").value.trim();
      addSession(minutes, note);
      renderTimerHistory();
    }
    seconds = 0;
    display.textContent = "00:00:00";
    document.getElementById("timer-note").value = "";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

export function renderTimerHistory() {
  const html = STATE.sessions
    .slice()
    .reverse()
    .map((s) => {
      const d = new Date(s.date);
      return `
        <div class="milestone">
          <span style="flex:1;">${d.toLocaleDateString()}</span>
          <span style="color:var(--lcars-blue); font-weight:600;">${s.minutes} min</span>
          <span style="color:var(--text-dim);">${s.note || "—"}</span>
        </div>`;
    })
    .join("");
  document.getElementById("timer-history").innerHTML = html || `<div class="empty">No sessions logged yet.</div>`;
}
