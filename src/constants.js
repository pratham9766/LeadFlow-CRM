export const STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

export const STATUS_STYLES = {
  New: 'bg-sky-50 text-sky-700 ring-sky-200',
  Contacted: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Qualified: 'bg-amber-50 text-amber-700 ring-amber-200',
  Converted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Lost: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export const SORT_OPTIONS = [
  { label: 'Created date', value: 'created_at' },
  { label: 'Name', value: 'name' },
  { label: 'Status', value: 'status' },
];
