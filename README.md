*`README.md`*
ARill.dev - Vercel Projects Portfolio

A modern, responsive portfolio website that automatically displays all my Vercel-deployed projects by syncing with the GitHub API.

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-active-success)

✨ Features

- **Auto Sync**: Fetches repositories directly from GitHub API
- **Vercel Filter**: Only displays projects with `vercel.app` deployment links
- **Smart Caching**: Uses localStorage to cache data for 1 hour to reduce API calls
- **Glassmorphism UI**: Modern dark theme with blur effects and gradient accents
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile
- **Error Handling**: Toast notifications + fallback to cached data on API failure
- **Performance**: Cache-first, network-update strategy for instant loading

🛠️ Tech Stack

| Category | Technology |
| --- | --- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Styling** | Custom CSS with CSS Variables |
| **API** | GitHub REST API v3 |
| **Hosting** | Vercel |
| **Fonts** | Google Fonts - Inter |

🚀 Getting Started

1. Clone the Repository
```bash
git clone https://github.com/arilcode/arill-portfolio.git
cd arill-portfolio
2. Configure Your GitHub Username
Open `main.js` and update the username:
const GITHUB_USERNAME = "your-github-username";
3. Exclude Repositories (Optional)
Add repo names you don't want to display in the `EXCLUDE_REPOS` array:
const EXCLUDE_REPOS = [
  "private-repo",
  "test-project"
];
4. Deploy to Vercel
1. Push to GitHub
2. Import project to https://vercel.com
3. Deploy. Done.

No build step required.

📁 Project Structure
.
├── index.html      # Main HTML structure and layout
├── style.css       # Global styles, components, and responsive design
├── main.js         # API fetching, caching logic, and DOM rendering
└── README.md       # Project documentation
🧠 How It Works

1.  *Cache First*: On page load, the app checks `localStorage` for cached project data and renders it immediately.
2.  *Background Update*: If the cache is older than 1 hour, it fetches fresh data from the GitHub API in the background.
3.  *Filtering*: It filters all your repos to only show ones with a `vercel.app` URL in either `homepage` or `description`.
4.  *Error Resilience*: If the GitHub API hits a rate limit or fails, it shows a toast notification and falls back to cached data.

📸 Preview

!https://via.placeholder.com/1200x600/0a0a0f/3b82f6?text=ARill.dev+Portfolio

📄 License

This project is licensed under the MIT License. Feel free to use it for your own portfolio.

👤 Author

*ARill*
- GitHub: https://github.com/arilcode
- Website: https://arill.dev

---

Made with ❤️ and Vercel

**Penjelasan tiap section:**

| Section | Gunanya |
| --- | --- |
| **Badges** | Biar keliatan aktif + profesional di atas repo |
| **Features** | HR / Recruiter langsung paham value websitenya |
| **Tech Stack** | Tabel rapi. Gampang di scan ATS dan recruiter |
| **Getting Started** | Biar orang lain bisa fork dan pake template kamu |
| **How It Works** | Jelaskan logic cache + API. Ini nilai plus banget |
| **License** | Wajib kalau mau di fork orang |

Tinggal ganti `arilcode` sama link github kamu ya.