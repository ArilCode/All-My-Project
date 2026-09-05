/*

  CONFIGURATION
  User-defined settings for GitHub integration and caching

*/

// GitHub username to fetch repositories from
const GITHUB_USERNAME = "arilcode";

// LocalStorage keys for caching project data
const CACHE_KEY = `vercel_projects_${GITHUB_USERNAME}`;
const CACHE_TIME_KEY = `vercel_projects_time_${GITHUB_USERNAME}`;

// Cache duration: 1 hour in milliseconds
const CACHE_DURATION = 1000 * 60 * 60;

// List of repository names to exclude from display
const EXCLUDE_REPOS = [
  "repo-yang-tidak-mau-ditampilkan"
];

/*

  UTILITY FUNCTIONS
  Helper functions for data processing and formatting

*/

/**
 * Extracts Vercel deployment URL from repository data
 * Checks both homepage field and description for vercel.app links
 * @param {Object} repo - GitHub repository object
 * @returns {string|null} Vercel URL if found, otherwise null
 */
function getVercelUrl(repo) {
  const homepage = repo.homepage || '';
  const desc = repo.description || '';
  
  // Check if homepage directly contains vercel.app
  if (homepage.includes('vercel.app')) return homepage;
  
  // Search for vercel.app URL in description using regex
  const match = desc.match(/https?:\/\/[^\s]+\.vercel\.app[^\s]*/);
  if (match) return match[0];
  
  return null;
}

/**
 * Formats ISO date string to Indonesian locale format
 * @param {string} dateString - ISO date string from GitHub API
 * @returns {string} Formatted date (e.g., "5 Sep 2026")
 */
function formatDate(dateString) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

/**
 * Displays a temporary toast notification to the user
 * Used for error handling and user feedback
 * @param {string} message - The message to display
 * @param {string} type - 'error' or 'info'
 */
function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  
  // Remove toast after 4 seconds with fade out animation
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/*

  DOM RENDERING
  Handles creating and injecting project cards into the DOM

*/

/**
 * Renders Vercel projects to the grid container
 * Manages loader, empty state, and project card generation
 * @param {Array} vercelRepos - Array of filtered repository objects with vercelUrl
 */
function renderRepos(vercelRepos) {
  const grid = document.getElementById('grid');
  const loader = document.getElementById('loader');
  const empty = document.getElementById('empty');
  
  // Hide loader once rendering starts
  loader.style.display = 'none';
  grid.innerHTML = '';
  
  // Show empty state if no projects found
  if (vercelRepos.length === 0) {
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  
  // Generate and append a card for each project
  vercelRepos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-top">
        <span class="badge">Live</span>
      </div>
      <h3>${repo.name}</h3>
      <p>${repo.description || 'Tidak ada deskripsi'}</p>
      <div class="dates">
        <div class="date-item"><b>Update:</b> ${formatDate(repo.updated_at)}</div>
        <div class="date-item"><b>Rilis:</b> ${formatDate(repo.created_at)}</div>
      </div>
      <a href="${repo.vercelUrl}" target="_blank" rel="noopener noreferrer" class="btn-vercel">
        Buka Project →
      </a>
    `;
    grid.appendChild(card);
  });
}

/*

  DATA FETCHING & CACHING
  Handles GitHub API requests and localStorage cache management

*/

/**
 * Fetches repositories from GitHub API, filters for Vercel projects,
 * and caches the result in localStorage
 * Includes error handling for rate limits and network failures
 * @returns {Promise<Array|null>} Array of Vercel projects or null on error
 */
async function fetchAndCache() {
  try {
    // Fetch up to 100 most recently updated repositories
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
    
    // RATE LIMIT HANDLING: Check for 403 Forbidden error
    if (res.status === 403) {
      showToast('GitHub API Rate Limit Exceeded. Showing cached data.', 'error');
      throw new Error('Rate limit exceeded');
    }
    if (!res.ok) throw new Error('Failed to fetch data from GitHub API');
    
    const repos = await res.json();
    
    // Filter: exclude repos, map to add vercelUrl, then filter only repos with vercelUrl
    const vercelRepos = repos
      .filter(repo => !EXCLUDE_REPOS.includes(repo.name))
      .map(repo => ({ ...repo, vercelUrl: getVercelUrl(repo) }))
      .filter(repo => repo.vercelUrl !== null);
    
    // Cache the processed data and timestamp
    localStorage.setItem(CACHE_KEY, JSON.stringify(vercelRepos));
    localStorage.setItem(CACHE_TIME_KEY, Date.now());
    
    return vercelRepos;
  } catch (err) {
    console.error('Error fetching repositories:', err);
    // Fallback to cached data if fetch fails
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      showToast('Using cached data due to network error.', 'info');
      return JSON.parse(cachedData);
    }
    return null;
  }
}

/*

  APPLICATION LOGIC
  Main orchestration for loading data with cache-first strategy

*/

/**
 * Loads Vercel projects using cache-first, network-update strategy
 * Renders cached data immediately, then fetches fresh data if cache is expired
 */
async function loadVercelProjects() {
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  const now = Date.now();
  let dataToRender = [];
  
  // Render cached data immediately for better UX
  if (cachedData) {
    dataToRender = JSON.parse(cachedData);
    renderRepos(dataToRender);
  }
  
  // Check if cache has expired
  const isCacheExpired = !cachedTime || (now - cachedTime) > CACHE_DURATION;
  
  if (isCacheExpired) {
    // Show loader while fetching fresh data
    document.getElementById('loader').innerHTML = 'Mengecek update terbaru...';
    document.getElementById('loader').style.display = 'block';
    
    const freshData = await fetchAndCache();
    
    // Re-render only if data has changed
    if (freshData && JSON.stringify(freshData) !== JSON.stringify(dataToRender)) {
      renderRepos(freshData);
    } else if (!cachedData && freshData) {
      renderRepos(freshData);
    } else {
      // Hide loader if no new data
      document.getElementById('loader').style.display = 'none';
    }
  }
}

/*

  INITIALIZATION
  Entry point executed when DOM is fully loaded

*/

document.addEventListener('DOMContentLoaded', () => {
  // Load projects on page load
  loadVercelProjects();
  
  // Set dynamic copyright year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
});