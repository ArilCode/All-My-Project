/*

  CONFIGURATION
  User-defined settings for GitHub integration and caching.

*/

const GITHUB_USERNAME = "ArilCode";
const CACHE_KEY = `vercel_projects_${GITHUB_USERNAME}`;
const CACHE_TIME_KEY = `vercel_projects_time_${GITHUB_USERNAME}`;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds
const EXCLUDE_REPOS = ["repo-yang-tidak-mau-ditampilkan"]; // Repositories to exclude from display

/*

  UTILITY FUNCTIONS
  Helper functions for data processing and formatting.
*/

/**
 * Extracts the Vercel deployment URL from repository metadata.
 * Checks both the homepage field and the description for a vercel.app link.
 * @param {Object} repo - GitHub repository object from the API.
 * @returns {string|null} The Vercel URL if found, otherwise null.
 */
function getVercelUrl(repo) {
  const homepage = repo.homepage || '';
  const desc = repo.description || '';
  if (homepage.includes('vercel.app')) return homepage;
  const match = desc.match(/https?:\/\/[^\s]+\.vercel\.app[^\s]*/);
  if (match) return match[0];
  return null;
}

/**
 * Generates the path to the project's Open Graph image.
 * Assumes each Vercel project hosts an og-image.png in its root directory.
 * @param {string} vercelUrl - The base URL of the Vercel deployment.
 * @returns {string} The full URL to the og-image.png.
 */
function getVercelOgImage(vercelUrl) {
  try {
    const url = new URL(vercelUrl);
    return `${url.origin}/og-image.png`;
  } catch {
    return '';
  }
}

/**
 * Formats an ISO date string to a human-readable Indonesian locale format.
 * @param {string} dateString - ISO date string from GitHub API.
 * @returns {string} Formatted date string, e.g., "5 Sep 2026".
 */
function formatDate(dateString) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

/**
 * Displays a temporary toast notification for user feedback.
 * @param {string} message - The message to display.
 * @param {'error' | 'info'} type - The type of notification to style the toast.
 */
function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/*

  DOM RENDERING
  Responsible for creating and injecting project cards into the DOM.
*/

/**
 * Renders the list of Vercel projects to the grid container.
 * Handles loader visibility and empty state.
 * @param {Array<Object>} vercelRepos - Array of repository objects with a vercelUrl property.
 */
function renderRepos(vercelRepos) {
  const grid = document.getElementById('grid');
  const loader = document.getElementById('loader');
  const empty = document.getElementById('empty');
  
  loader.style.display = 'none';
  grid.innerHTML = '';
  
  if (vercelRepos.length === 0) {
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  
  vercelRepos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'card';
    const ogImage = getVercelOgImage(repo.vercelUrl);
    
    card.innerHTML = `
      <img src="${ogImage}" alt="Preview ${repo.name}"
           style="width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:1rem;background:#1a1a1f;border:1px solid var(--border);"
           loading="lazy"
           onerror="this.style.display='none'">

      <div class="card-top">
        <span class="badge">Live</span>
      </div>
      <h3>${repo.name}</h3>
      <p>${repo.description || 'No description available'}</p>
      <div class="dates">
        <div class="date-item"><b>Updated:</b> ${formatDate(repo.updated_at)}</div>
        <div class="date-item"><b>Released:</b> ${formatDate(repo.created_at)}</div>
      </div>
      <a href="${repo.vercelUrl}" target="_blank" rel="noopener noreferrer" class="btn-vercel">
        View Project →
      </a>
    `;
    grid.appendChild(card);
  });
}

/*

  DATA FETCHING & CACHING
  Manages GitHub API requests and localStorage cache strategy.
*/

/**
 * Fetches repositories from the GitHub API, filters for Vercel projects,
 * and stores the result in localStorage.
 * Implements fallback to cached data on network or rate limit errors.
 * @returns {Promise<Array<Object>|null>} Array of Vercel projects or null on failure.
 */
async function fetchAndCache() {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
    
    if (res.status === 403) {
      showToast('GitHub API Rate Limit Exceeded. Displaying cached data.', 'error');
      throw new Error('Rate limit exceeded');
    }
    if (!res.ok) throw new Error('Failed to fetch data from GitHub API');
    
    const repos = await res.json();
    
    let vercelRepos = repos
      .filter(repo => !EXCLUDE_REPOS.includes(repo.name))
      .map(repo => ({ ...repo, vercelUrl: getVercelUrl(repo) }))
      .filter(repo => repo.vercelUrl !== null);
    
    // Sort by creation date descending. Newest first, oldest last.
    vercelRepos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(vercelRepos));
    localStorage.setItem(CACHE_TIME_KEY, Date.now());
    return vercelRepos;
  } catch (err) {
    console.error('Error fetching repositories:', err);
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      showToast('Using cached data due to network error.', 'info');
      let parsed = JSON.parse(cachedData);
      parsed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return parsed;
    }
    return null;
  }
}

/*

  APPLICATION LOGIC
  Orchestrates the cache-first data loading strategy.
*/

/**
 * Loads Vercel projects using a cache-first, then network-update approach.
 * Renders cached data immediately for performance, then fetches fresh data if cache is stale.
 */
async function loadVercelProjects() {
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  const now = Date.now();
  let dataToRender = [];
  
  if (cachedData) {
    dataToRender = JSON.parse(cachedData);
    dataToRender.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderRepos(dataToRender);
  }
  
  const isCacheExpired = !cachedTime || (now - cachedTime) > CACHE_DURATION;
  
  if (isCacheExpired) {
    document.getElementById('loader').innerHTML = 'Checking for updates...';
    document.getElementById('loader').style.display = 'block';
    const freshData = await fetchAndCache();
    if (freshData && JSON.stringify(freshData) !== JSON.stringify(dataToRender)) {
      renderRepos(freshData);
    } else if (!cachedData && freshData) {
      renderRepos(freshData);
    } else {
      document.getElementById('loader').style.display = 'none';
    }
  }
}

/*

  INITIALIZATION
  Entry point executed when the DOM is fully loaded.
*/

document.addEventListener('DOMContentLoaded', () => {
  loadVercelProjects();
  document.getElementById('year').textContent = new Date().getFullYear();
});