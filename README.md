# Miss Leen Frontend

React + Vite frontend for the Miss Leen factory management system.

## Live Site

🌐 **[https://omarsalaheldieen.github.io/miss-leen-frontend/](https://omarsalaheldieen.github.io/miss-leen-frontend/)**

## Local Development

```bash
npm install
npm run dev
```

Requires the backend running at `http://localhost:5000`.

## Deploy to GitHub Pages

```bash
npm run deploy
```

This builds the app and pushes to the `gh-pages` branch automatically.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g. `https://miss-leen-backend.onrender.com`) |

Set in `.env.production` for production builds.

## Tech Stack

- React 18 + Vite
- React Router v6 (HashRouter for GitHub Pages)
- Axios for API calls
- react-hot-toast for notifications
