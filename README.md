# LeadFlow CRM

LeadFlow CRM is a production-ready mini CRM for capturing, searching, filtering, and managing sales leads. It uses a React/Vite dashboard, an Express REST API, PostgreSQL for production data, and an automatic JSON-file fallback for local development when `DATABASE_URL` is not configured.

## Features

- Lead CRUD: create, fetch, update status, and delete leads.
- Lead fields: `id`, `name`, `phone`, `source`, `status`, `created_at`.
- Allowed sources: `Call`, `WhatsApp`, `Field`.
- Allowed statuses: `Interested`, `Not Interested`, `Converted`.
- Dashboard metrics for total, interested, converted, and not interested leads.
- Search by name or phone.
- Filter by source and status.
- Responsive desktop and mobile dashboard.
- Loading states, empty state UI, form validation, toast notifications, hover transitions, and subtle animations.
- PostgreSQL storage with parameterized SQL queries.
- Local JSON fallback at `server/data/leads.json` when `DATABASE_URL` is missing.

## Tech Stack

Frontend:
- React
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

Create your environment file:

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
- `FRONTEND_URL`: Allowed CORS origin for the frontend.
- `VITE_API_URL`: Frontend API base URL. Use `/api` locally with the Vite proxy, or your deployed backend URL plus `/api`.
- `DATABASE_URL`: PostgreSQL connection string. If missing, the app automatically uses `server/data/leads.json`.

## Database Schema

The server creates the table automatically when `DATABASE_URL` is configured:

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  source VARCHAR(20) NOT NULL,
  status VARCHAR(30) DEFAULT 'Interested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Routes

Primary backend routes:

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/leads` | Fetch leads. Supports `search`, `source`, and `status` query params. |
| `POST` | `/leads` | Create a new lead. |
| `PUT` | `/leads/:id` | Update lead status. |
| `DELETE` | `/leads/:id` | Delete a lead. |
| `GET` | `/leads/stats` | Fetch dashboard metrics. |
| `GET` | `/health` | Health check and enum metadata. |

The same routes are also available under `/api`, for example `/api/leads`, which is what the frontend uses by default.

## Request Examples

Create lead:

```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "source": "WhatsApp",
  "status": "Interested"
}
```

Update status:

```json
{
  "status": "Converted"
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

Start production server:

```bash
npm start
```

## Deployment

### Frontend on Vercel

1. Import the repository in Vercel.
2. Set the build command:

```bash
npm run build
```

3. Set the output directory:

```text
dist
```

4. Add frontend environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

### Backend on Render

1. Create a new Web Service.
2. Set the start command:

```bash
npm start
```

3. Add backend environment variables:

```env
PORT=10000
FRONTEND_URL=https://your-vercel-app.vercel.app
DATABASE_URL=your-postgresql-connection-string
```

Render provides the runtime port through `PORT`; keep that variable enabled.

### PostgreSQL

Use any hosted PostgreSQL provider such as Neon, Supabase, Render PostgreSQL, or Railway. Add the provider connection string as `DATABASE_URL`.

## Storage Behavior

- With `DATABASE_URL`: data is stored in PostgreSQL.
- Without `DATABASE_URL`: data is stored in `server/data/leads.json`.
- The frontend API contract stays identical in both modes.
