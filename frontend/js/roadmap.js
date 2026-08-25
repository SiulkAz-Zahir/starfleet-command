// roadmap.js
//
// Owns everything related to the roadmap data file: fetching it,
// computing progress percentages, and rendering the dashboard +
// roadmap views. Nothing else in the app should reach into
// roadmap.json directly — ask this module for numbers instead.

import { STATE, toggleTask, persist } from "./state.js";

let ROADMAP = { vectors: [], phases: [] };

export async function loadRoadmap() {
  const res = await fetch("data/roadmap.json");
  ROADMAP = await res.json();
  return ROADMAP;
}

function allMilestones() {
  return ROADMAP.phases.flatMap((p) => p.milestones);
}

function vectorProgress(vectorId) {
  const miles = allMilestones().filter((m) => m.vector === vectorId);
  const done = miles.filter((m) => STATE.tasks[m.id]).length;
  return { done, total: miles.length, pct: miles.length ? Math.round((done / miles.length) * 100) : 0 };
}

export function overallProgress() {
  const miles = allMilestones();
  const done = miles.filter((m) => STATE.tasks[m.id]).length;
  return { done, total: miles.length, pct: miles.length ? Math.round((done / miles.length) * 100) : 0 };
}

export function renderDashboard() {
  const overall = overallProgress();
  document.getElementById("stat-progress").textContent = overall.pct + "%";
  document.getElementById("stat-milestones").textContent = `${overall.done}/${overall.total}`;

  const totalMinutes = STATE.sessions.reduce((a, s) => a + s.minutes, 0);
  document.getElementById("stat-hours").textContent = (totalMinutes / 60).toFixed(1) + "h";
  document.getElementById("stat-logs").textContent = STATE.logs.length;

  const vecHtml = ROADMAP.vectors
    .map((v) => {
      const p = vectorProgress(v.id);
      return `
        <div class="vector-row">
          <div class="row-head"><span>${v.name}</span><span>${p.pct}%</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${p.pct}%; background:${v.color}"></div></div>
        </div>`;
    })
    .join("");
  document.getElementById("dash-vectors").innerHTML = vecHtml;
}

export function renderRoadmap() {
  const html = ROADMAP.phases
    .map((phase) => {
      const rows = phase.milestones
        .map((m) => {
          const done = !!STATE.tasks[m.id];
          const vector = ROADMAP.vectors.find((v) => v.id === m.vector);
          return `
            <label class="milestone ${done ? "done" : ""}">
              <input type="checkbox" data-milestone="${m.id}" ${done ? "checked" : ""}>
              <span class="mtext" style="border-left:3px solid ${vector?.color || "#666"}; padding-left:8px;">${m.text}</span>
            </label>`;
        })
        .join("");
      return `<div class="panel"><div class="panel-title">${phase.name}</div>${rows}</div>`;
    })
    .join("");
  document.getElementById("roadmap-content").innerHTML = html;

  document.querySelectorAll("[data-milestone]").forEach((el) => {
    el.addEventListener("change", (e) => {
      toggleTask(e.target.dataset.milestone);
      renderRoadmap();
      renderDashboard();
    });
  });
}

export function getRoadmap() {
  return ROADMAP;
}
