// app.js — the only file that knows about ALL the other modules.
// Everything else here is deliberately siloed (state / roadmap /
// log / resources / assistant don't import each other). This file
// is where they get wired together and where tab-switching lives.

import { STATE, exportState, importState, resetState } from "./state.js";
import { loadRoadmap, renderDashboard, renderRoadmap } from "./roadmap.js";
import { renderLog, wireLog, wireTimer, renderTimerHistory } from "./log.js";
import { loadAndRenderResources } from "./resources.js";
import { initAssistant, wireAssistant } from "./assistant.js";

const renderers = {
  dashboard: renderDashboard,
  roadmap: renderRoadmap,
  resources: loadAndRenderResources,
  assistant: () => {}, // console log persists across tab switches, nothing to re-render
  log: renderLog,
  timer: renderTimerHistory,
};

function switchTab(tab) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${tab}`).classList.add("active");
  document.querySelectorAll(".rail-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.rail-btn[data-tab="${tab}"]`).classList.add("active");
  renderers[tab]?.();
}

function wireNav() {
  document.querySelectorAll(".rail-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function wireDataOps() {
  document.getElementById("btn-export").addEventListener("click", exportState);
  document.getElementById("btn-import").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importState(ev.target.result);
        renderDashboard();
        renderRoadmap();
        renderLog();
        renderTimerHistory();
      } catch {
        alert("Import failed: not valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });
  document.getElementById("btn-reset").addEventListener("click", () => {
    if (confirm("Erase all local progress? This cannot be undone.")) {
      resetState();
      renderDashboard();
      renderRoadmap();
      renderLog();
      renderTimerHistory();
    }
  });
}

function tickStardate() {
  const el = document.getElementById("stardate");
  const now = new Date();
  const stardate = ((now.getFullYear() - 2000) * 1000 + now.getMonth() * 83 + now.getDate()).toFixed(1);
  el.textContent = `STARDATE ${stardate}`;
}

async function main() {
  await loadRoadmap();
  wireNav();
  wireDataOps();
  wireLog();
  wireTimer();
  wireAssistant();
  await initAssistant();
  tickStardate();
  setInterval(tickStardate, 60000);
  switchTab("dashboard");
}

main();
