const GITHUB_USER = "raaj2493";

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("on");
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

menuBtn?.addEventListener("click", () => {
  const expanded = menuBtn.getAttribute("aria-expanded") === "true";
  menuBtn.setAttribute("aria-expanded", String(!expanded));
  navLinks.classList.toggle("open");
});

const navAnchors = [...document.querySelectorAll(".nav-links a")];
const sections = [...document.querySelectorAll("main section")];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navAnchors.forEach((anchor) => {
        anchor.classList.toggle("active", anchor.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { threshold: 0.5 }
);

sections.forEach((section) => sectionObserver.observe(section));

async function fetchGitHubStats() {
  const statsEl = document.getElementById("github-stats");
  if (!statsEl) return;

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner`),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      throw new Error("GitHub request failed");
    }

    const user = await userRes.json();
    const repos = await reposRes.json();
    const ownedRepos = repos.filter((repo) => !repo.fork);
    const totalStars = ownedRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

    const stats = [
      ["Repositories", user.public_repos],
      ["Stars", totalStars],
      ["Followers", user.followers],
      ["Following", user.following],
    ];

    statsEl.innerHTML = stats
      .map(
        ([label, value]) => `
        <article class="card stat reveal on">
          <p>${label}</p>
          <strong>${value}</strong>
        </article>
      `
      )
      .join("");
  } catch (error) {
    statsEl.innerHTML = `<p class="muted">Unable to load GitHub stats right now.</p>`;
  }
}

async function fetchHeatmap(year) {
  const heatmapEl = document.getElementById("heatmap");
  const statusEl = document.getElementById("heatmap-status");

  if (!heatmapEl || !statusEl) return;

  statusEl.textContent = "Loading contribution data...";

  try {
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=${year}`);
    if (!response.ok) throw new Error("Heatmap API failed");

    const data = await response.json();
    const contributions = data?.contributions || [];
    if (!contributions.length) throw new Error("No contributions found");

    const maxCount = Math.max(...contributions.map((item) => item.count));

    heatmapEl.innerHTML = contributions
      .map((day) => {
        const level = maxCount === 0 ? 0 : Math.min(4, Math.ceil((day.count / maxCount) * 4));
        return `<button class="cell" data-level="${level}" title="${day.date}: ${day.count} contributions" aria-label="${day.date}, ${day.count} contributions"></button>`;
      })
      .join("");

    statusEl.textContent = `Showing contributions for ${year}.`;
  } catch (error) {
    heatmapEl.innerHTML = "";
    statusEl.textContent = "Contribution data is temporarily unavailable.";
  }
}

function initYearFilter() {
  const yearFilter = document.getElementById("year-filter");
  if (!yearFilter) return;

  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearFilter.appendChild(option);
  }

  yearFilter.addEventListener("change", (event) => {
    fetchHeatmap(event.target.value);
  });

  fetchHeatmap(currentYear);
}

fetchGitHubStats();
initYearFilter();
