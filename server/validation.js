import { LEAD_SOURCES, LEAD_STATUSES } from './constants.js';

const trimString = (value) => (typeof value === 'string' ? value.trim() : '');

export function validateLeadCreate(payload) {
  const name = trimString(payload.name);
  const phone = trimString(payload.phone);
  const source = trimString(payload.source);
  const status = trimString(payload.status || 'Interested');
  const errors = {};

  if (!name) errors.name = 'Name is required.';
  if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

  if (!phone) errors.phone = 'Phone number is required.';
  if (phone && !/^\d+$/.test(phone)) errors.phone = 'Phone number must contain digits only.';
  if (phone.length > 15) errors.phone = 'Phone number must be 15 digits or fewer.';

  if (!source) errors.source = 'Source is required.';
  if (source && !LEAD_SOURCES.includes(source)) errors.source = 'Source is invalid.';

  if (!LEAD_STATUSES.includes(status)) errors.status = 'Status is invalid.';

  return {
    value: { name, phone, source, status },
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

export function parseLeadFilters(query) {
  const search = trimString(query.search || query.q);
  const status = trimString(query.status);
  const source = trimString(query.source);

  return {
    search,
    status: LEAD_STATUSES.includes(status) ? status : '',
    source: LEAD_SOURCES.includes(source) ? source : '',
  };
}
