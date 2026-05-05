const searchInput = document.querySelector("[data-post-search]");
const cards = Array.from(document.querySelectorAll("[data-post-card]"));
const chips = Array.from(document.querySelectorAll("[data-category-filter]"));
const emptyState = document.querySelector("[data-empty-state]");

let activeCategory = "all";

function normalize(value) {
  return value.trim().toLowerCase();
}

function applyFilters() {
  const query = normalize(searchInput?.value || "");
  let visibleCount = 0;

  cards.forEach((card) => {
    const categories = card.dataset.categories || "";
    const text = card.dataset.search || "";
    const matchesCategory = activeCategory === "all" || categories.includes(activeCategory);
    const matchesQuery = !query || text.includes(query);
    const shouldShow = matchesCategory && matchesQuery;

    card.hidden = !shouldShow;
    if (shouldShow) visibleCount += 1;
  });

  if (emptyState) {
    emptyState.hidden = visibleCount !== 0;
  }
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeCategory = chip.dataset.categoryFilter || "all";
    chips.forEach((item) => item.classList.toggle("is-active", item === chip));
    applyFilters();
  });
});

searchInput?.addEventListener("input", applyFilters);

const dateEl = document.querySelector("[data-dashboard-date]");
const timeEl = document.querySelector("[data-dashboard-time]");

function updateClock() {
  if (!dateEl || !timeEl) return;
  const now = new Date();
  dateEl.textContent = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(now);
  timeEl.textContent = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(now);
}

updateClock();
setInterval(updateClock, 30000);

const newsList = document.querySelector("[data-news-list]");
const replitProxyForm = document.querySelector("[data-replit-proxy-form]");
const saveReplitProxyButton = document.querySelector("[data-save-replit-proxy]");
const checkReplitHealthButton = document.querySelector("[data-check-replit-health]");
const replitPreviewToggle = document.querySelector("[data-toggle-replit-preview]");
const replitProxyPreview = document.querySelector("[data-replit-proxy-preview]");
const replitProxyStatus = document.querySelector("[data-replit-proxy-status]");
const replitTarget = document.querySelector("[data-replit-target]");
const replitProxyStorageKey = "panwoo.replitProxyUrl";
const replitProxyUrlHelp =
  "Use the running Replit app URL, such as https://your-replit-app.replit.app or https://your-replit-dev-url.replit.dev. Do not use a replit.com/@user/project page.";

function normalizedReplitAppUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const host = url.hostname.toLowerCase();
    if (!host.endsWith(".replit.app") && !host.endsWith(".replit.dev")) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function currentReplitProxyUrl() {
  return normalizedReplitAppUrl(replitProxyForm?.elements.proxyUrl.value.trim() || "");
}

function savedReplitProxyUrl() {
  return normalizedReplitAppUrl(localStorage.getItem(replitProxyStorageKey) || "");
}

function setProxyStatus(status, detail) {
  if (!replitProxyStatus) return;
  replitProxyStatus.replaceChildren();
  const label = document.createElement("span");
  label.textContent = "Current Proxy Status";
  const value = document.createElement("strong");
  value.textContent = `status: ${status}`;
  replitProxyStatus.append(label, value);
  if (detail) {
    const detailEl = document.createElement("p");
    detailEl.textContent = detail;
    replitProxyStatus.append(detailEl);
  }
}

function saveCurrentReplitProxyUrl() {
  const url = currentReplitProxyUrl();
  if (!url) {
    setProxyStatus("invalid url", replitProxyUrlHelp);
    return "";
  }
  localStorage.setItem(replitProxyStorageKey, url);
  replitProxyForm.elements.proxyUrl.value = url;
  return url;
}

function updateReplitPreview() {
  if (!replitProxyPreview || !replitPreviewToggle) return;
  const url = savedReplitProxyUrl();
  const enabled = Boolean(replitPreviewToggle.checked && url);
  replitProxyPreview.hidden = !enabled;
  if (enabled && replitProxyPreview.src !== url) {
    replitProxyPreview.src = url;
  }
}

const initialStoredReplitProxyUrl = localStorage.getItem(replitProxyStorageKey) || "";
const initialReplitProxyUrl = savedReplitProxyUrl();
if (replitProxyForm?.elements.proxyUrl) {
  if (initialReplitProxyUrl) {
    replitProxyForm.elements.proxyUrl.value = initialReplitProxyUrl;
  } else if (initialStoredReplitProxyUrl) {
    localStorage.removeItem(replitProxyStorageKey);
    replitProxyForm.elements.proxyUrl.value = "";
    setProxyStatus(
      "invalid saved url",
      "The saved Replit project page was cleared. Paste a running .replit.app or .replit.dev URL.",
    );
  }
}

replitProxyForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const url = savedReplitProxyUrl();
  if (!url) {
    setProxyStatus("not configured", "Save a Replit App URL before opening the proxy.");
    return;
  }
  window.open(url, "_blank", "noopener");
});

saveReplitProxyButton?.addEventListener("click", () => {
  const url = saveCurrentReplitProxyUrl();
  if (!url) return;
  updateReplitPreview();
  saveReplitProxyButton.textContent = "Saved";
  setTimeout(() => {
    saveReplitProxyButton.textContent = "Save URL";
  }, 1400);
});

checkReplitHealthButton?.addEventListener("click", () => {
  const url = savedReplitProxyUrl();
  if (!url) {
    setProxyStatus("not configured", "Save a Replit App URL before running a health check.");
    return;
  }

  setProxyStatus("checking", `${url}/health`);
  fetch(`${url}/health`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      const target = payload.target || "";
      setProxyStatus(
        "connected",
        `target: ${target}\nhost: ${payload.host || ""}\nport: ${payload.port || ""}\nprotocol: ${
          payload.protocol || ""
        }`,
      );
      if (replitTarget) {
        replitTarget.textContent = target || "Unknown";
      }
    })
    .catch((error) => {
      setProxyStatus("unreachable", error.message);
    });
});

replitProxyForm?.elements.proxyUrl?.addEventListener("input", updateReplitPreview);
replitPreviewToggle?.addEventListener("change", updateReplitPreview);

function formatPublished(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function renderNews(items) {
  if (!newsList) return;
  newsList.innerHTML = "";
  items.slice(0, 9).forEach((item) => {
    const article = document.createElement("article");
    article.className = "news-item";
    article.innerHTML = `
      <div>
        <span>${item.source || "Security"}</span>
        <time>${formatPublished(item.published)}</time>
      </div>
      <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
      ${item.summary ? `<p>${item.summary}</p>` : ""}
    `;
    newsList.append(article);
  });
}

if (newsList) {
  fetch(`${document.body.dataset.baseurl || ""}/assets/data/security-news.json`, { cache: "no-store" })
    .then((response) => response.json())
    .then((payload) => renderNews(payload.items || []))
    .catch(() => {
      newsList.innerHTML = '<p class="empty-state">Security news is unavailable.</p>';
    });
}
