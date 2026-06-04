import pg from 'pg';
import { LEAD_STATUSES, SORT_FIELDS } from './constants.js';

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
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      company VARCHAR(150) NOT NULL,
      status VARCHAR(30) DEFAULT 'New',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(150) NOT NULL DEFAULT ''");
  await pool.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS company VARCHAR(150) NOT NULL DEFAULT ''");
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT');
  await pool.query('ALTER TABLE leads ALTER COLUMN phone TYPE VARCHAR(20)');
  await pool.query("ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'New'");
  await pool.query(`
    UPDATE leads
    SET status = CASE
      WHEN status = 'Interested' THEN 'New'
      WHEN status = 'Not Interested' THEN 'Lost'
      WHEN status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Lost') THEN status
      ELSE 'New'
    END
  `);

  return true;
}

function buildWhere(filters) {
  const clauses = [];
  const values = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    clauses.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR company ILIKE $${values.length})`);
  }

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`status = $${values.length}`);
  }

  return {
    text: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

export const pgStore = {
  async listLeads(filters) {
    const where = buildWhere(filters);
    const sortColumn = SORT_FIELDS[filters.sortBy] || SORT_FIELDS.created_at;
    const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM leads ${where.text}`, where.values);
    const total = countResult.rows[0]?.total || 0;
    const values = [...where.values, filters.limit, filters.offset];
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const { rows } = await pool.query(
      `SELECT id, name, email, phone, company, status, notes, created_at
       FROM leads
       ${where.text}
       ORDER BY ${sortColumn} ${sortDirection}, id DESC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      values,
    );

    return { leads: rows, pagination: paginationMeta(total, filters.page, filters.limit) };
  },

  async createLead(input) {
    const { rows } = await pool.query(
      `INSERT INTO leads (name, email, phone, company, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, company, status, notes, created_at`,
      [input.name, input.email, input.phone, input.company, input.status, input.notes],
    );
    return rows[0];
  },

  async updateLead(id, input) {
    const { rows } = await pool.query(
      `UPDATE leads
       SET name = $1, email = $2, phone = $3, company = $4, status = $5, notes = $6
       WHERE id = $7
       RETURNING id, name, email, phone, company, status, notes, created_at`,
      [input.name, input.email, input.phone, input.company, input.status, input.notes, id],
    );
    return rows[0] || null;
  },

  async updateLeadStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE leads
       SET status = $1
       WHERE id = $2
       RETURNING id, name, email, phone, company, status, notes, created_at`,
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
      if (row.status in byStatus) byStatus[row.status] = row.count;
    }

    return {
      total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
      byStatus,
    };
  },
};
