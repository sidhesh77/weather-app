# Weather App

Full-stack weather app — React frontend + Node.js backend.

## What this does

Search by city, zip, landmark, or GPS coordinates (`12.97,77.59`). Pulls **live data** from [Open-Meteo](https://open-meteo.com/) (free, no API key).

- Current weather + 5-day forecast
- "Use my location" via browser geolocation
- Save searches to SQLite with optional date range
- Full CRUD on saved records
- Export DB to JSON, CSV, XML, Markdown, PDF
- YouTube search link + OpenStreetMap embed

## Stack

| Part | Tech |
|------|------|
| Frontend | React + Vite (JavaScript) |
| Backend | Node.js + Express |
| Database | SQLite (`better-sqlite3`) |

## How to run

Node 18+ required.

### One command (both servers)

```bash
cd weather-app
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

Or: `./start.sh`

### Separate terminals

```bash
cd backend && npm run dev    # terminal 1
cd frontend && npm run dev   # terminal 2
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/lookup?q=` | Live weather |
| GET | `/api/lookup?lat=&lon=` | Weather by coords |
| POST | `/api/records` | Create record |
| GET | `/api/records` | List all |
| PUT | `/api/records/:id` | Update |
| DELETE | `/api/records/:id` | Delete |
| GET | `/api/export?format=json\|csv\|xml\|md\|pdf` | Export |

## Notes

- DB file `backend/weather.db` auto-created on first run
- No API keys needed