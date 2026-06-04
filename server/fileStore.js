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

function normalizeLead(lead) {
  const statusMap = {
    Interested: 'New',
    'Not Interested': 'Lost',
  };

  return {
    id: lead.id,
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    status: LEAD_STATUSES.includes(lead.status) ? lead.status : statusMap[lead.status] || 'New',
    notes: lead.notes || '',
    created_at: lead.created_at || new Date().toISOString(),
  };
}

async function readLeads() {
  await ensureStore();
  const raw = await readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw).map(normalizeLead);
}

async function writeLeads(leads) {
  await ensureStore();
  await writeFile(DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

function applyFilters(leads, filters) {
  const search = filters.search.toLowerCase();
  return leads.filter((lead) => {
    const matchesSearch = search
      ? lead.name.toLowerCase().includes(search) ||
        lead.email.toLowerCase().includes(search) ||
        lead.company.toLowerCase().includes(search)
      : true;
    const matchesStatus = filters.status ? lead.status === filters.status : true;
    return matchesSearch && matchesStatus;
  });
}

function sortLeads(leads, filters) {
  const direction = filters.sortOrder === 'asc' ? 1 : -1;
  return [...leads].sort((a, b) => {
    const left = filters.sortBy === 'created_at' ? new Date(a.created_at).getTime() : String(a[filters.sortBy] || '');
    const right = filters.sortBy === 'created_at' ? new Date(b.created_at).getTime() : String(b[filters.sortBy] || '');

    if (left < right) return -1 * direction;
    if (left > right) return 1 * direction;
    return b.id - a.id;
  });
}

function paginate(leads, filters) {
  const total = leads.length;
  const totalPages = Math.max(Math.ceil(total / filters.limit), 1);
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.limit;

  return {
    leads: leads.slice(start, start + filters.limit),
    pagination: { total, page, limit: filters.limit, totalPages },
  };
}

export const fileStore = {
  async listLeads(filters) {
    const leads = await readLeads();
    return paginate(sortLeads(applyFilters(leads, filters), filters), filters);
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

  async updateLead(id, input) {
    const leads = await readLeads();
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;
    leads[index] = { ...leads[index], ...input };
    await writeLeads(leads);
    return leads[index];
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
    const byStatus = LEAD_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
    for (const lead of leads) {
      if (lead.status in byStatus) byStatus[lead.status] += 1;
    }

    return {
      total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
      byStatus,
    };
  },
};
