import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase, pgStore, pool } from './db.js';
import { fileStore } from './fileStore.js';
import { parseLeadFilters, validateLeadCreate, validateLeadStatus } from './validation.js';
import { LEAD_SOURCES, LEAD_STATUSES } from './constants.js';

const app = express();
const port = Number(process.env.PORT || 5000);
let store = fileStore;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
);
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: pool ? 'postgresql' : 'file',
    sources: LEAD_SOURCES,
    statuses: LEAD_STATUSES,
  });
});

app.get('/api/leads', async (req, res, next) => {
  try {
    const leads = await store.listLeads(parseLeadFilters(req.query));
    res.json({ leads });
  } catch (error) {
    next(error);
  }
});

app.post('/api/leads', async (req, res, next) => {
  try {
    const result = validateLeadCreate(req.body || {});
    if (!result.valid) {
      return res.status(422).json({ message: 'Please fix the highlighted fields.', errors: result.errors });
    }

    const lead = await store.createLead(result.value);
    res.status(201).json({ lead });
  } catch (error) {
    next(error);
  }
});

app.put('/api/leads/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid lead id.' });
    }

    const result = validateLeadStatus(req.body || {});
    if (!result.valid) {
      return res.status(422).json({ message: 'Please choose a valid status.', errors: result.errors });
    }

    const lead = await store.updateLeadStatus(id, result.value.status);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });

    res.json({ lead });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/leads/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid lead id.' });
    }

    const deleted = await store.deleteLead(id);
    if (!deleted) return res.status(404).json({ message: 'Lead not found.' });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/leads/stats', async (_req, res, next) => {
  try {
    const stats = await store.getStats();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

try {
  const usingPostgres = await initDatabase();
  store = usingPostgres ? pgStore : fileStore;
  app.listen(port, () => {
    console.log(`LeadFlow API running on http://localhost:${port}`);
    console.log(`Storage: ${usingPostgres ? 'PostgreSQL' : 'local file fallback'}`);
  });
} catch (error) {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
}
