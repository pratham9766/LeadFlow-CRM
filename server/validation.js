import { LEAD_STATUSES, SORT_FIELDS } from './constants.js';

const trimString = (value) => (typeof value === 'string' ? value.trim() : '');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadPayload(payload) {
  const name = trimString(payload.name);
  const email = trimString(payload.email).toLowerCase();
  const phone = trimString(payload.phone);
  const company = trimString(payload.company);
  const status = trimString(payload.status || 'New');
  const notes = trimString(payload.notes);
  const errors = {};

  if (!name) errors.name = 'Name is required.';
  if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

  if (!email) errors.email = 'Email is required.';
  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  if (email.length > 150) errors.email = 'Email must be 150 characters or fewer.';

  if (!phone) errors.phone = 'Phone number is required.';
  if (phone.length > 20) errors.phone = 'Phone number must be 20 characters or fewer.';

  if (!company) errors.company = 'Company name is required.';
  if (company.length > 150) errors.company = 'Company name must be 150 characters or fewer.';

  if (!LEAD_STATUSES.includes(status)) errors.status = 'Status is invalid.';

  return {
    value: { name, email, phone, company, status, notes },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function validateLeadStatus(payload) {
  const status = trimString(payload.status);
  const errors = {};

  if (!LEAD_STATUSES.includes(status)) {
    errors.status = 'Status is invalid.';
  }

  return {
    value: { status },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function parseLeadQuery(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  const sortBy = SORT_FIELDS[query.sortBy] ? query.sortBy : 'created_at';
  const sortOrder = String(query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
  const status = trimString(query.status);

  return {
    search: trimString(query.search || query.q),
    status: LEAD_STATUSES.includes(status) ? status : '',
    sortBy,
    sortOrder,
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function validateLeadRequest(req, res, next) {
  const result = validateLeadPayload(req.body || {});
  if (!result.valid) {
    return res.status(422).json({ message: 'Please fix the highlighted fields.', errors: result.errors });
  }

  req.validatedLead = result.value;
  next();
}

export function validateStatusRequest(req, res, next) {
  const result = validateLeadStatus(req.body || {});
  if (!result.valid) {
    return res.status(422).json({ message: 'Please choose a valid status.', errors: result.errors });
  }

  req.validatedStatus = result.value.status;
  next();
}
