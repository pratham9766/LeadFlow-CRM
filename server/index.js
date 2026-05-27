import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase, pgStore } from './db.js';
import { fileStore } from './fileStore.js';
import { parseLeadFilters, validateCreateLeadRequest, validateStatusUpdateRequest } from './validation.js';
import { LEAD_SOURCES, LEAD_STATUSES } from './constants.js';

const app = express();
const port = Number(process.env.PORT || 5000);
let store = fileStore;
let storageMode = 'file';

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
);
app.use(express.json({ limit: '64kb' }));

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    database: storageMode,
    sources: LEAD_SOURCES,
    statuses: LEAD_STATUSES,
  });
});

router.get('/leads', async (req, res, next) => {
  try {
    const leads = await store.listLeads(parseLeadFilters(req.query));
    res.json({ leads });
  } catch (error) {
    next(error);
  }
});

router.post('/leads', validateCreateLeadRequest, async (req, res, next) => {
  try {
    const lead = await store.createLead(req.validatedLead);
    res.status(201).json({ lead });
  } catch (error) {
    next(error);
  }
});

router.put('/leads/:id', validateStatusUpdateRequest, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid lead id.' });
    }

    const lead = await store.updateLeadStatus(id, req.validatedStatus);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });

    res.json({ lead });
  } catch (error) {
    next(error);
  }
});

router.delete('/leads/:id', async (req, res, next) => {
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

router.get('/leads/stats', async (_req, res, next) => {
  try {
    const stats = await store.getStats();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

app.use(router);
app.use('/api', router);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

try {
  const usingPostgres = await initDatabase();
  store = usingPostgres ? pgStore : fileStore;
  storageMode = usingPostgres ? 'postgresql' : 'file';
  app.listen(port, () => {
    console.log(`LeadFlow API running on http://localhost:${port}`);
    console.log(`Storage: ${storageMode === 'postgresql' ? 'PostgreSQL' : 'local file fallback'}`);
  });
} catch (error) {
  console.error('Database initialization failed, using local file fallback:', error.message);
  store = fileStore;
  storageMode = 'file';
  app.listen(port, () => {
    console.log(`LeadFlow API running on http://localhost:${port}`);
    console.log('Storage: local file fallback');
  });
}
