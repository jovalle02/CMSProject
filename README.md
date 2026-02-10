# Dynamic Headless CMS

A dynamic headless CMS with an admin panel for managing collections and entries, and a public site for browsing content. Collections are defined in the database — creating a new collection instantly makes it available via the API and public site with no code changes or server restart.

## Architecture

- **Backend** (`server/`): Express + SQLite (sql.js) REST API
- **Frontend** (`client/`): Vite + React 18 + React Router v6

## Running the Project

```bash
# Terminal 1: Backend
cd server
npm install
npm run seed     # populate demo data
npm run dev      # starts Express on :3000

# Terminal 2: Frontend
cd client
npm install
npm run dev      # starts Vite on :5173, proxies /api to :3000
```

Open `http://localhost:5173` to view the public site, or `http://localhost:5173/admin` for the admin panel.

## Features

- **Dynamic Collections**: Define content schemas with custom fields (string, text, number, boolean, select, date, markdown)
- **Live Markdown Preview**: Side-by-side editor with real-time rendering using react-markdown + remark-gfm
- **Dynamic API**: `GET /api/content/:slug` serves any collection — the database IS the API specification
- **Filtering & Pagination**: `?status=published`, `?filter.field=value`, `?sort=-created_at`, `?page=1&per_page=20`
- **Field Validation**: Dynamic validation engine that validates entries against their collection's field definitions

## API Endpoints

### Admin
- `GET /api/admin/collections` — List all collections
- `GET /api/admin/collections/:id` — Get collection by ID
- `POST /api/admin/collections` — Create collection
- `PUT /api/admin/collections/:id` — Update collection
- `DELETE /api/admin/collections/:id` — Delete collection (cascades entries)

### Content (Dynamic)
- `GET /api/content/:slug` — List entries for a collection
- `GET /api/content/:slug/:id` — Get single entry
- `POST /api/content/:slug` — Create entry
- `PUT /api/content/:slug/:id` — Update entry
- `DELETE /api/content/:slug/:id` — Delete entry
