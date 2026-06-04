import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBriefcase,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTarget,
  FiTrash2,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { createLead, deleteLead, getLeads, getStats, updateLead, updateLeadStatus } from './api';
import { SORT_OPTIONS, STATUSES, STATUS_STYLES } from './constants';

const emptyLead = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'New',
  notes: '',
};

const defaultPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const defaultStats = {
  total: 0,
  byStatus: STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {}),
};

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-50 animate-fade-up">
      <div
        className={`rounded-lg px-4 py-3 text-sm font-medium shadow-soft ring-1 ${
          toast.type === 'error'
            ? 'bg-rose-50 text-rose-800 ring-rose-200'
            : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
        }`}
        role="status"
      >
        <div className="flex items-center gap-3">
          <span>{toast.message}</span>
          <button className="text-inherit opacity-70 transition hover:opacity-100" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <FiTrendingUp aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-950">LeadFlow CRM</p>
            <p className="text-xs font-medium text-slate-500">Small business lead management</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 sm:flex">
          <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-500" />
          Live dashboard
        </div>
      </div>
    </header>
  );
}

function DashboardCards({ stats, loading }) {
  const cards = [
    { label: 'Total Leads', value: stats.total, icon: FiUsers, tone: 'bg-slate-950 text-white' },
    { label: 'New', value: stats.byStatus.New, icon: FiPlus, tone: 'bg-sky-600 text-white' },
    { label: 'Contacted', value: stats.byStatus.Contacted, icon: FiMail, tone: 'bg-indigo-600 text-white' },
    { label: 'Qualified', value: stats.byStatus.Qualified, icon: FiTarget, tone: 'bg-amber-500 text-white' },
    { label: 'Converted', value: stats.byStatus.Converted, icon: FiCheckCircle, tone: 'bg-emerald-600 text-white' },
    { label: 'Lost', value: stats.byStatus.Lost, icon: FiTrendingDown, tone: 'bg-rose-600 text-white' },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6" aria-label="Dashboard metrics">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <article
            className="animate-fade-up rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft"
            key={card.label}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-slate-200" /> : card.value}
                </p>
              </div>
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${card.tone}`}>
                <Icon aria-hidden="true" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

function LeadFields({ form, setForm, errors, compact = false }) {
  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className={`grid gap-4 ${compact ? 'md:grid-cols-2' : ''}`}>
      <label className="field-label">
        Name
        <input className="input-control" name="name" onChange={updateField} placeholder="Aarav Mehta" value={form.name} />
        <FieldError message={errors.name} />
      </label>

      <label className="field-label">
        Email
        <input
          className="input-control"
          name="email"
          onChange={updateField}
          placeholder="aarav@company.com"
          type="email"
          value={form.email}
        />
        <FieldError message={errors.email} />
      </label>

      <label className="field-label">
        Phone Number
        <input
          className="input-control"
          inputMode="tel"
          name="phone"
          onChange={updateField}
          placeholder="9876543210"
          value={form.phone}
        />
        <FieldError message={errors.phone} />
      </label>

      <label className="field-label">
        Company Name
        <input
          className="input-control"
          name="company"
          onChange={updateField}
          placeholder="Northstar Retail"
          value={form.company}
        />
        <FieldError message={errors.company} />
      </label>

      <label className="field-label">
        Lead Status
        <select className="input-control" name="status" onChange={updateField} value={form.status}>
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <FieldError message={errors.status} />
      </label>

      <label className={`field-label ${compact ? 'md:col-span-2' : ''}`}>
        Notes
        <textarea
          className="input-control min-h-28 resize-y"
          name="notes"
          onChange={updateField}
          placeholder="Budget, requirement, next follow-up, or conversation notes"
          value={form.notes}
        />
        <FieldError message={errors.notes} />
      </label>
    </div>
  );
}

function LeadForm({ onCreate, submitting, errors }) {
  const [form, setForm] = useState(emptyLead);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const created = await onCreate(form);
    if (created) setForm(emptyLead);
  };

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">Add Lead</h2>
          <p className="text-sm text-slate-500">Capture contact, company, status, and context.</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
          <FiPlus aria-hidden="true" />
        </div>
      </div>

      <LeadFields errors={errors} form={form} setForm={setForm} />

      <button className="btn-primary mt-5 w-full justify-center" disabled={submitting} type="submit">
        {submitting ? <FiRefreshCw className="animate-spin" aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
        {submitting ? 'Saving Lead' : 'Add Lead'}
      </button>
    </form>
  );
}

function SearchFilters({ filters, setFilters, onRefresh, loading }) {
  const updateFilter = (patch) => {
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label="Search and filters">
      <div className="grid gap-3 xl:grid-cols-[1fr_160px_170px_140px_110px_auto]">
        <label className="relative">
          <span className="sr-only">Search by name, email, or company</span>
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-control pl-10"
            onChange={(event) => updateFilter({ search: event.target.value })}
            placeholder="Search name, email, or company"
            value={filters.search}
          />
        </label>

        <label>
          <span className="sr-only">Filter by status</span>
          <select className="input-control" onChange={(event) => updateFilter({ status: event.target.value })} value={filters.status}>
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Sort by</span>
          <select className="input-control" onChange={(event) => updateFilter({ sortBy: event.target.value })} value={filters.sortBy}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Sort order</span>
          <select
            className="input-control"
            onChange={(event) => updateFilter({ sortOrder: event.target.value })}
            value={filters.sortOrder}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Rows per page</span>
          <select
            className="input-control"
            onChange={(event) => updateFilter({ limit: Number(event.target.value) })}
            value={filters.limit}
          >
            {[5, 10, 20, 50].map((limit) => (
              <option key={limit} value={limit}>
                {limit} rows
              </option>
            ))}
          </select>
        </label>

        <button className="btn-secondary justify-center" disabled={loading} onClick={onRefresh} type="button">
          {loading ? <FiRefreshCw className="animate-spin" aria-hidden="true" /> : <FiRefreshCw aria-hidden="true" />}
          Refresh
        </button>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
          <FiUsers aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-950">No leads found</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">Add a lead or adjust search, filters, and pagination.</p>
      </div>
    </div>
  );
}

function LeadTable({ leads, loading, onStatusChange, onDelete, onEdit, pendingId }) {
  if (!loading && leads.length === 0) return <EmptyState />;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Leads list">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Lead', 'Company', 'Phone', 'Status', 'Notes', 'Created', 'Actions'].map((header) => (
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td className="px-4 py-4" key={cellIndex}>
                        <span className="block h-5 animate-pulse rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              : leads.map((lead) => (
                  <tr className="transition hover:bg-indigo-50/40" key={lead.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-44 items-center gap-2 text-sm font-medium text-slate-700">
                        <FiBriefcase className="text-slate-400" aria-hidden="true" />
                        {lead.company || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">{lead.phone}</td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-44 flex-col gap-2">
                        <StatusBadge status={lead.status} />
                        <select
                          className="input-control h-9 py-1 text-sm"
                          disabled={pendingId === lead.id}
                          onChange={(event) => onStatusChange(lead.id, event.target.value)}
                          value={lead.status}
                        >
                          {STATUSES.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-4 text-sm text-slate-600">
                      <p className="line-clamp-2">{lead.notes || 'No notes yet'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={pendingId === lead.id}
                          onClick={() => onEdit(lead)}
                          title="Edit lead"
                          type="button"
                        >
                          <FiEdit3 aria-hidden="true" />
                          <span className="sr-only">Edit {lead.name}</span>
                        </button>
                        <button
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={pendingId === lead.id}
                          onClick={() => onDelete(lead)}
                          title="Delete lead"
                          type="button"
                        >
                          <FiTrash2 aria-hidden="true" />
                          <span className="sr-only">Delete {lead.name}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Pagination({ pagination, setFilters, loading }) {
  const goToPage = (page) => {
    setFilters((current) => ({ ...current, page }));
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing page <span className="font-bold text-slate-950">{pagination.page}</span> of{' '}
        <span className="font-bold text-slate-950">{pagination.totalPages}</span> for{' '}
        <span className="font-bold text-slate-950">{pagination.total}</span> leads
      </p>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary h-10"
          disabled={loading || pagination.page <= 1}
          onClick={() => goToPage(pagination.page - 1)}
          type="button"
        >
          <FiChevronLeft aria-hidden="true" />
          Prev
        </button>
        <button
          className="btn-secondary h-10"
          disabled={loading || pagination.page >= pagination.totalPages}
          onClick={() => goToPage(pagination.page + 1)}
          type="button"
        >
          Next
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function EditLeadModal({ lead, errors, onClose, onSave, saving }) {
  const [form, setForm] = useState(lead || emptyLead);

  useEffect(() => {
    setForm(lead || emptyLead);
  }, [lead]);

  if (!lead) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(lead.id, form);
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <form className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-soft" onSubmit={handleSubmit}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Edit Lead</h2>
            <p className="text-sm text-slate-500">Update contact, company, status, and notes.</p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <FiX aria-hidden="true" />
            <span className="sr-only">Close edit modal</span>
          </button>
        </div>

        <LeadFields compact errors={errors} form={form} setForm={setForm} />

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="btn-secondary justify-center" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary justify-center" disabled={saving} type="submit">
            {saving ? <FiRefreshCw className="animate-spin" aria-hidden="true" /> : <FiCheckCircle aria-hidden="true" />}
            {saving ? 'Saving Changes' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(defaultStats);
  const [pagination, setPagination] = useState(defaultPagination);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editingLead, setEditingLead] = useState(null);
  const [toast, setToast] = useState(null);

  const queryFilters = useMemo(
    () => ({
      search: filters.search.trim(),
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: filters.limit,
    }),
    [filters],
  );

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(window.__leadflowToast);
    window.__leadflowToast = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadResult, statRows] = await Promise.all([getLeads(queryFilters), getStats()]);
      setLeads(leadResult.leads);
      setPagination(leadResult.pagination || defaultPagination);
      setStats({ ...defaultStats, ...statRows, byStatus: { ...defaultStats.byStatus, ...statRows.byStatus } });
    } catch {
      notify('Could not load leads. Check that the API server is running.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify, queryFilters]);

  useEffect(() => {
    const timeout = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setCreateErrors({});
    try {
      await createLead(payload);
      notify('Lead added successfully.');
      setFilters((current) => ({ ...current, page: 1 }));
      await loadData();
      return true;
    } catch (error) {
      setCreateErrors(error.response?.data?.errors || {});
      notify(error.response?.data?.message || 'Could not add lead.', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (lead) => {
    setEditErrors({});
    setEditingLead(lead);
  };

  const handleSaveEdit = async (id, payload) => {
    setSavingEdit(true);
    setEditErrors({});
    try {
      await updateLead(id, payload);
      notify('Lead details updated.');
      setEditingLead(null);
      await loadData();
    } catch (error) {
      setEditErrors(error.response?.data?.errors || {});
      notify(error.response?.data?.message || 'Could not update lead.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setPendingId(id);
    const previous = leads;
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    try {
      await updateLeadStatus(id, status);
      notify('Lead status updated.');
      await loadData();
    } catch {
      setLeads(previous);
      notify('Could not update status.', 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (lead) => {
    const confirmed = window.confirm(`Delete ${lead.name} permanently?`);
    if (!confirmed) return;

    setPendingId(lead.id);
    try {
      await deleteLead(lead.id);
      notify('Lead deleted.');
      await loadData();
    } catch {
      notify('Could not delete lead.', 'error');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <EditLeadModal
        errors={editErrors}
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSave={handleSaveEdit}
        saving={savingEdit}
      />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-3">
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-700">Lead management CRM</p>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Manage every customer lead from first touch to close.
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">
                A fast dashboard for small businesses to capture contacts, track status, update details, and keep notes
                organized.
              </p>
            </div>
            <button className="btn-secondary self-start lg:self-auto" onClick={loadData} type="button">
              <FiRefreshCw className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              Sync
            </button>
          </div>
        </section>

        <DashboardCards loading={loading} stats={stats} />

        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <div className="xl:sticky xl:top-24 xl:self-start">
            <LeadForm errors={createErrors} onCreate={handleCreate} submitting={submitting} />
          </div>

          <div className="grid gap-4">
            <SearchFilters filters={filters} loading={loading} onRefresh={loadData} setFilters={setFilters} />
            <LeadTable
              leads={leads}
              loading={loading}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              pendingId={pendingId}
            />
            <Pagination loading={loading} pagination={pagination} setFilters={setFilters} />
          </div>
        </div>
      </main>
    </div>
  );
}
