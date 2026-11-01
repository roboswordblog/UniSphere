# UniSphere

A hackathon starter for discovering college events, mapping them, and connecting with friends across campuses.

## Stack
- React with Vite
- Leaflet with React Leaflet
- Flask
- SQLite locally, PostgreSQL/Neon in production

## Start Frontend
```bash
npm install
npm run dev
```

## Start Backend
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/app.py
```

## Database
By default, UniSphere uses local SQLite at `backend/app.db`.

To use Neon/PostgreSQL, set `DATABASE_URL` to your Neon Postgres connection string before starting Flask:
```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
python backend/app.py
```

The Neon Auth JWKS URL is not the database connection string. Use the pooled or direct Postgres connection string from the Neon dashboard.

## Current Endpoints
- `GET /api/health`
- `GET /api/colleges?query=stanford`
- `GET /api/colleges/:id/events`
- `GET /api/events/:id`
- `POST /api/admin/sync-events`
- `POST /api/signup`
- `POST /api/login`
- `GET /api/users/:id/profile`
- `POST /api/events/:id/join`

## Deploying To Vercel
This repo includes `vercel.json` so Vercel can build the Vite frontend and route `/api/*` requests to the Flask backend.

Before deploying, add a Vercel environment variable named `DATABASE_URL` with your Neon Postgres connection string:
```bash
postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
```

Use the real Neon database connection string, not the Neon Auth JWKS URL. Local SQLite is fine for development, but Vercel serverless functions need Neon/PostgreSQL for persistent data.

Recommended Vercel settings:
- Build command: `npm run build`
- Output directory: `dist`
- Python dependencies: installed from root `requirements.txt`

Keep `auto_sync_on_start = false` in `backend/config.toml` on Vercel. For production event syncing, call `POST /api/admin/sync-events` manually or from a scheduled job.

## Event Sync
UniSphere syncs supported school calendars through official Localist JSON APIs instead of scraping brittle HTML pages.

Run a manual database update:
```bash
python backend/sync_events.py
```

Or call the backend endpoint:
```bash
curl -X POST http://127.0.0.1:5000/api/admin/sync-events \
  -H "Content-Type: application/json" \
  -d '{"days":45,"per_page":50}'
```

Optional background syncing is controlled in `backend/config.toml`:
```toml
[events_sync]
auto_sync_on_start = true
auto_sync_interval_minutes = 360
```

## Notes
The current database keeps colleges that have reliable calendar API sources. Schools without a reliable event source should stay out until a supported API/feed is found.
