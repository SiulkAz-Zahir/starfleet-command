// resources.js
//
// Renders whatever is currently in data/resources.json. That file
// is regenerated on a schedule by scripts/refresh_resources.py,
// run for free by GitHub Actions — this module doesn't know or
// care how the data got there, it just displays it. That
// separation (this module vs. the script that fills the data) is
// the whole point of the static-site + scheduled-job pattern.

export async function loadAndRenderResources() {
  const res = await fetch("data/resources.json");
  const data = await res.json();

  const meta = document.getElementById("resources-meta");
  meta.textContent = data.last_refreshed
    ? `Last refreshed: ${new Date(data.last_refreshed).toLocaleString()}`
    : "Not refreshed yet — run scripts/refresh_resources.py (see README).";

  const list = document.getElementById("resources-list");
  if (!data.items || !data.items.length) {
    list.innerHTML = `<div class="empty">No resources cached yet.</div>`;
    return;
  }
  list.innerHTML = data.items
    .map(
      (item) => `
      <div class="resource">
        <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
        <div class="meta">${item.source}${item.tag ? " · " + item.tag : ""}</div>
      </div>`
    )
    .join("");
}
