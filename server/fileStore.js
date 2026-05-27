import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEAD_STATUSES } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leads.json');

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, 'utf8');
  } catch {
    await writeFile(DATA_FILE, '[]', 'utf8');
  }
}

async function readLeads() {
  await ensureStore();
  const raw = await readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeLeads(leads) {
  await ensureStore();
  await writeFile(DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

function applyFilters(leads, filters) {
  return leads.filter((lead) => {
    const matchesSearch = filters.search
      ? lead.name.toLowerCase().includes(filters.search.toLowerCase()) || lead.phone.includes(filters.search)
      : true;
    const matchesStatus = filters.status ? lead.status === filters.status : true;
    const matchesSource = filters.source ? lead.source === filters.source : true;
    return matchesSearch && matchesStatus && matchesSource;
  });
}

export const fileStore = {
  async listLeads(filters) {
    const leads = await readLeads();
    return applyFilters(leads, filters).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async createLead(input) {
    const leads = await readLeads();
    const nextId = leads.reduce((max, lead) => Math.max(max, lead.id), 0) + 1;
    const lead = {
      id: nextId,
      ...input,
      created_at: new Date().toISOString(),
    };
    leads.push(lead);
    await writeLeads(leads);
    return lead;
  },

  async updateLeadStatus(id, status) {
    const leads = await readLeads();
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;
    leads[index] = { ...leads[index], status };
    await writeLeads(leads);
    return leads[index];
  },

  async deleteLead(id) {
    const leads = await readLeads();
    const next = leads.filter((lead) => lead.id !== id);
    if (next.length === leads.length) return false;
    await writeLeads(next);
    return true;
  },

  async getStats() {
    const leads = await readLeads();
    const stats = LEAD_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
    for (const lead of leads) {
      stats[lead.status] = (stats[lead.status] || 0) + 1;
    }
    return {
      total: leads.length,
      interested: stats.Interested,
      converted: stats.Converted,
      notInterested: stats['Not Interested'],
    };
  },
};
