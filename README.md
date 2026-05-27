# LeadFlow CRM

A lightweight lead management system built from the product and technical specification in `LeadFlow CRM.docx`.

## Features

- Add leads with name, phone number, source, and status.
- List all leads with source, status, and created date.
- Update lead status instantly.
- Permanently delete leads with confirmation.
- Dashboard cards for total, interested, converted, and not interested leads.
- Search by name or phone.
- Filter by status and source.
- Responsive SaaS-style UI with loading states, empty states, toasts, keyboard-friendly controls, and reduced-motion support.
- Express API with validation, parameterized PostgreSQL queries, and local file fallback for development.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/leads` | Add lead |
| `GET` | `/api/leads` | Fetch leads, supports `search`, `status`, and `source` query params |
| `PUT` | `/api/leads/:id` | Update lead status |
| `DELETE` | `/api/leads/:id` | Delete lead |
| `GET` | `/api/leads/stats` | Dashboard metrics |
| `GET` | `/api/health` | Health check and enum metadata |

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:5000`.

If no PostgreSQL environment variables are set, the API uses `server/data/leads.json` as a development fallback.

## PostgreSQL Setup

Create a database and add a connection string to `.env`:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/leadflow_crm
```

The server creates the `leads` table automatically if it does not exist:

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  source VARCHAR(20) NOT NULL,
  status VARCHAR(30) DEFAULT 'Interested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Allowed sources: `Call`, `WhatsApp`, `Field`.
Allowed statuses: `Interested`, `Not Interested`, `Converted`.
