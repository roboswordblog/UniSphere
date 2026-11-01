# UniSphere

A hackathon starter for discovering college events, mapping them, and connecting with friends across campuses.

## Stack
- React with Vite
- Leaflet with React Leaflet
- Flask
- PyTorch
- SQL

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

## Current Endpoints
- `GET /api/health`
- `GET /api/colleges?query=stanford`
- `GET /api/colleges/:id/events`
- `GET /api/events/:id`
- `POST /api/admin/sync-events`
- `POST /api/predict`

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
