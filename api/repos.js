/*

  SERVERLESS FUNCTION (Vercel)
  Mengambil repo dari GitHub API di sisi server, lalu menyaring
  repo yang tidak mau ditampilkan memakai Environment Variable.
  Daftar EXCLUDE_REPOS tidak pernah dikirim ke browser.

*/

module.exports = async (req, res) => {
  const username = process.env.GITHUB_USERNAME || 'ArilCode';

  // EXCLUDE_REPOS diisi pisah koma, contoh: repo-a,repo-b
  const exclude = (process.env.EXCLUDE_REPOS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'all-my-project',
  };
  // Opsional: token biar tidak kena rate limit GitHub
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const r = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { headers }
    );

    if (!r.ok) {
      return res.status(r.status === 403 ? 403 : 502).json({ error: 'github_error' });
    }

    const repos = await r.json();

    // Hanya kirim field yang dipakai tampilan
    const data = repos
      .filter((repo) => !exclude.includes(repo.name.toLowerCase()))
      .map(({ name, description, homepage, created_at, updated_at }) => ({
        name,
        description,
        homepage,
        created_at,
        updated_at,
      }));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
};
