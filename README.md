# LeadFlow CRM

LeadFlow CRM is a production-ready lead management dashboard for small businesses. It helps teams capture customer leads, track pipeline status, search and filter records, edit details, and monitor lead statistics from a clean responsive React interface.

## Features

- Add new leads and customers.
- View all leads in a dashboard table.
- Edit full lead details.
- Update only lead status from the table.
- Delete leads with confirmation.
- Search by name, email, or company.
- Filter by status.
- Sort by created date, name, or status.
- Paginate lead results.
- Dashboard statistics for total, new, contacted, qualified, converted, and lost leads.
- Loading states, empty states, toast notifications, form validation, subtle animations, and mobile-friendly layout.
- PostgreSQL storage with parameterized SQL queries.
- JSON fallback storage at `server/data/leads.json` when `DATABASE_URL` is not configured.

## Tech Stack

Frontend:
- React.js
- Vite
- Tailwind CSS
- Axios
- React Icons

Backend:
- Node.js
- Express.js
- CORS
- dotenv

Database:
- PostgreSQL
- Local JSON fallback

## Lead Fields

Each lead contains:

- `id`
- `name`
- `email`
- `phone`
- `company`
- `status`
- `notes`
- `created_at`

Allowed statuses:

- `New`
- `Contacted`
- `Qualified`
- `Converted`
- `Lost`

## Project Structure

```text
project-root/
├── server/
│   ├── data/
│   ├── db.js
│   ├── fileStore.js
│   ├── validation.js
│   ├── constants.js
│   └── index.js
├── src/
│   ├── api.js
│   ├── App.jsx
│   ├── main.jsx
│   ├── constants.js
│   └── styles.css
├── .env.example
├── README.md
├── package.json
└── vite.config.js
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Run frontend and backend together:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

## Environment Variables

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=/api
DATABASE_URL=postgres://postgres:postgres@localhost:5432/leadflow_crm
```

Variable notes:
- `PORT`: Express server port.
- `FRONTEND_URL`: Allowed frontend origin for CORS.
- `VITE_API_URL`: Frontend API base URL. Use `/api` locally with the Vite proxy or a deployed backend URL ending in `/api`.
- `DATABASE_URL`: PostgreSQL connection string. If missing or unavailable during startup, the backend uses JSON fallback storage.

## Database Schema

The server creates and upgrades the table automatically when PostgreSQL is configured:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company VARCHAR(150) NOT NULL,
  status VARCHAR(30) DEFAULT 'New',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Routes

Primary routes:

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/leads` | Create a lead. |
| `GET` | `/leads` | Get leads with search, filter, sort, and pagination. |
| `PUT` | `/leads/:id` | Update full lead details. |
| `PATCH` | `/leads/:id/status` | Update only lead status. |
| `DELETE` | `/leads/:id` | Delete a lead. |
| `GET` | `/leads/stats` | Get dashboard statistics. |
| `GET` | `/health` | Health check and status metadata. |

The same routes are also available under `/api`, for example `/api/leads`.

## Query Parameters

`GET /leads` supports:

| Parameter | Values |
| --- | --- |
| `search` | Name, email, or company text |
| `status` | `New`, `Contacted`, `Qualified`, `Converted`, `Lost` |
| `sortBy` | `created_at`, `name`, `status` |
| `sortOrder` | `asc`, `desc` |
| `page` | Positive number |
| `limit` | `1` to `50` |

Example:

```text
/leads?search=acme&status=Qualified&sortBy=name&sortOrder=asc&page=1&limit=10
```

## Request Examples

Create or update lead:

```json
{
  "name": "Aarav Mehta",
  "email": "aarav@northstar.com",
  "phone": "9876543210",
  "company": "Northstar Retail",
  "status": "New",
  "notes": "Interested in a demo next week."
}
```

Update status:

```json
{
  "status": "Qualified"
}
```

## Quality Checks

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

Start backend:

```bash
npm start
```

## Deployment

### Vercel Frontend

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

### Render Backend

Start command:

```bash
npm start
```

Environment variables:

```env
PORT=10000
FRONTEND_URL=https://your-vercel-app.vercel.app
DATABASE_URL=your-postgresql-connection-string
```

### PostgreSQL

Use any hosted PostgreSQL provider such as Neon, Supabase, Render PostgreSQL, Railway, or another managed PostgreSQL service. Add its connection string as `DATABASE_URL`.

## Storage Behavior

- With a working `DATABASE_URL`: data is stored in PostgreSQL.
- Without `DATABASE_URL`, or if PostgreSQL cannot initialize: data is stored in `server/data/leads.json`.
- The frontend API contract remains the same in both modes.
