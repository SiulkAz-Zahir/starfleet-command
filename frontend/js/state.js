// state.js
//
// WHY THIS FILE EXISTS (read this before touching anything else):
// Every other module in this app reads and writes progress data.
// If each module talked to localStorage directly, you'd have five
// different places that could get the storage format wrong.
// Instead, this is the ONLY file that touches localStorage. Every
// other module goes through the functions exported here.
//
// This is the same idea as a database layer in a bigger app: one
// choke point for reads/writes, so the format can change in one
// place instead of twenty.

const STORAGE_KEY = "starfleet_state_v1";

function defaultState() {
  return {
    tasks: {},        // { milestoneId: true }
    logs: [],          // [{ date, text }]
    sessions: [],       // [{ date, minutes, note }]
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Could not read saved state, starting fresh.", e);
  }
  return defaultState();
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Single in-memory copy, loaded once at startup.
export const STATE = loadState();

export function persist() {
  saveState(STATE);
}

export function toggleTask(id) {
  STATE.tasks[id] = !STATE.tasks[id];
  persist();
}

export function addLog(text) {
  STATE.logs.unshift({ date: new Date().toISOString(), text });
  persist();
}

export function addSession(minutes, note) {
  STATE.sessions.push({ date: new Date().toISOString(), minutes, note });
  persist();
}

export function exportState() {
  const blob = new Blob([JSON.stringify(STATE, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `starfleet_state_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importState(jsonText) {
  const parsed = JSON.parse(jsonText); // throws on invalid JSON — caller handles it
  Object.assign(STATE, defaultState(), parsed);
  persist();
}

export function resetState() {
  Object.assign(STATE, defaultState());
  persist();
}
