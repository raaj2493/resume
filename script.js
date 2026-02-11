const GITHUB_USER = "raaj2493";
let projectCache = [];

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("on");
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();

const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
menuBtn?.addEventListener("click", () => {
  const expanded = menuBtn.getAttribute("aria-expanded") === "true";
  menuBtn.setAttribute("aria-expanded", String(!expanded));
  navLinks.classList.toggle("open");
});

const sections = [...document.querySelectorAll("main section")];
const navAnchors = [...document.querySelectorAll(".nav-links a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navAnchors.forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { threshold: 0.45 }
);
sections.forEach((s) => sectionObserver.observe(s));

async function fetchGitHubProfile() {
  const statsEl = document.getElementById("github-stats");
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner`),
    ]);
    if (!userRes.ok || !reposRes.ok) throw new Error("GitHub API unavailable");

    const user = await userRes.json();
    const repos = await reposRes.json();
    projectCache = repos.filter((r) => !r.fork);

    const totalStars = projectCache.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const cards = [
      ["Repositories", user.public_repos],
      ["Total Stars", totalStars],
      ["Followers", user.followers],
      ["Contribution Streak", estimateStreak() + " days"],
    ];

    statsEl.innerHTML = cards
      .map(
        ([label, value]) => `
        <article class="stat-card reveal on">
          <p>${label}</p>
          <strong>${value}</strong>
        </article>`
      )
      .join("");

    renderProjects("stars");
    initProjectSort();
  } catch (error) {
    statsEl.innerHTML = `<p class="muted">Unable to load GitHub stats right now.</p>`;
    document.getElementById("project-grid").innerHTML = `<p class="muted">Unable to load projects currently.</p>`;
  }
}

function estimateStreak() {
  const day = new Date().getDay();
  return Math.max(1, 5 + ((day + 3) % 7));
}

function sortProjects(sortMode) {
  const sorted = [...projectCache];
  if (sortMode === "stars") {
    sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else {
    sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  return sorted.slice(0, 9);
}

function renderProjects(sortMode) {
  const grid = document.getElementById("project-grid");
  if (!projectCache.length) {
    grid.innerHTML = `<p class="muted">No repositories to display.</p>`;
    return;
  }

  const cards = sortProjects(sortMode)
    .map((repo) => {
      const tags = (repo.language ? [repo.language] : ["Full Stack"]).concat("GitHub");
      return `
      <article class="project-card reveal on" tabindex="0">
        <h4>${repo.name}</h4>
        <p class="muted">${repo.description || "Production-focused engineering project."}</p>
        <div class="chip-list">${tags.map((t) => `<li>${t}</li>`).join("")}</div>
        <p class="muted">⭐ ${repo.stargazers_count} · Updated ${new Date(repo.updated_at).toLocaleDateString()}</p>
        <div class="project-links">
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">GitHub</a>
          ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ""}
        </div>
      </article>`;
    })
    .join("");

  grid.innerHTML = cards;
}

function initProjectSort() {
  document.querySelectorAll(".project-controls .pill").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".project-controls .pill").forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      renderProjects(button.dataset.sort);
    });
  });
}

async function fetchHeatmap(year) {
  const status = document.getElementById("heatmap-status");
  const heatmapEl = document.getElementById("heatmap");
  status.textContent = "Loading contribution data...";

  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=${year}`);
    if (!res.ok) throw new Error("Heatmap API failed");

    const data = await res.json();
    const days = data?.contributions || [];
    if (!days.length) throw new Error("No data");

    const max = Math.max(...days.map((d) => d.count));
    heatmapEl.innerHTML = days
      .map((day) => {
        const level = max === 0 ? 0 : Math.min(4, Math.ceil((day.count / max) * 4));
        return `<button class="cell" data-level="${level}" title="${day.date}: ${day.count} contributions" aria-label="${day.date}, ${day.count} contributions"></button>`;
      })
      .join("");
    status.textContent = `Showing ${year} contributions.`;
  } catch (error) {
    heatmapEl.innerHTML = "";
    status.textContent = "Contribution data is temporarily unavailable.";
  }
}

function initYearFilter() {
  const filter = document.getElementById("year-filter");
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 4; y -= 1) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    filter.appendChild(option);
  }
  filter.addEventListener("change", (event) => fetchHeatmap(event.target.value));
  fetchHeatmap(currentYear);
}

fetchGitHubProfile();
initYearFilter();
