import pg from 'pg';
import { LEAD_STATUSES } from './constants.js';

const { Pool } = pg;

const hasPostgresConfig = Boolean(process.env.DATABASE_URL);

export const pool = hasPostgresConfig
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    })
  : null;

export async function initDatabase() {
  if (!pool) return false;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      source VARCHAR(20) NOT NULL,
      status VARCHAR(30) DEFAULT 'Interested',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query('ALTER TABLE leads ALTER COLUMN phone TYPE VARCHAR(20)');

  return true;
}

function buildWhere(filters) {
  const clauses = [];
  const values = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    clauses.push(`(name ILIKE $${values.length} OR phone ILIKE $${values.length})`);
  }

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`status = $${values.length}`);
  }

  if (filters.source) {
    values.push(filters.source);
    clauses.push(`source = $${values.length}`);
  }

  return {
    text: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

export const pgStore = {
  async listLeads(filters) {
    const where = buildWhere(filters);
    const { rows } = await pool.query(
      `SELECT id, name, phone, source, status, created_at
       FROM leads
       ${where.text}
       ORDER BY created_at DESC, id DESC`,
      where.values,
    );
    return rows;
  },

  async createLead(input) {
    const { rows } = await pool.query(
      `INSERT INTO leads (name, phone, source, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, phone, source, status, created_at`,
      [input.name, input.phone, input.source, input.status],
    );
    return rows[0];
  },

  async updateLeadStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE leads
       SET status = $1
       WHERE id = $2
       RETURNING id, name, phone, source, status, created_at`,
      [status, id],
    );
    return rows[0] || null;
  },

  async deleteLead(id) {
    const result = await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async getStats() {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM leads
       GROUP BY status`,
    );
    const byStatus = LEAD_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
    for (const row of rows) {
      byStatus[row.status] = row.count;
    }
    return {
      total: rows.reduce((sum, row) => sum + row.count, 0),
      interested: byStatus.Interested,
      converted: byStatus.Converted,
      notInterested: byStatus['Not Interested'],
    };
  },
};
