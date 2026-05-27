import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCheckCircle,
  FiFilter,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { createLead, deleteLead, getLeads, getStats, updateLeadStatus } from './api';
import { SOURCES, STATUSES, STATUS_STYLES } from './constants';

const initialForm = {
  name: '',
  phone: '',
  source: 'WhatsApp',
  status: 'Interested',
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
            <p className="text-xs font-medium text-slate-500">Pipeline control for fast-moving teams</p>
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
    { label: 'Interested', value: stats.interested, icon: FiActivity, tone: 'bg-indigo-600 text-white' },
    { label: 'Converted', value: stats.converted, icon: FiCheckCircle, tone: 'bg-emerald-600 text-white' },
    { label: 'Not Interested', value: stats.notInterested, icon: FiPhone, tone: 'bg-rose-600 text-white' },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard metrics">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <article
            className="animate-fade-up rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft"
            key={card.label}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-200" /> : card.value}
                </p>
              </div>
              <div className={`grid h-11 w-11 place-items-center rounded-lg ${card.tone}`}>
                <Icon aria-hidden="true" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function LeadForm({ onCreate, submitting, errors }) {
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const created = await onCreate(form);
    if (created) setForm(initialForm);
  };

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">Add Lead</h2>
          <p className="text-sm text-slate-500">Capture the next conversation before it slips away.</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
          <FiPlus aria-hidden="true" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Name
          <input
            className="input-control"
            name="name"
            onChange={handleChange}
            placeholder="Rahul Sharma"
            value={form.name}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>

        <label className="field-label">
          Phone Number
          <input
            className="input-control"
            inputMode="numeric"
            name="phone"
            onChange={handleChange}
            placeholder="9876543210"
            value={form.phone}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>

        <label className="field-label">
          Source
          <select className="input-control" name="source" onChange={handleChange} value={form.source}>
            {SOURCES.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
          {errors.source && <span className="field-error">{errors.source}</span>}
        </label>

        <label className="field-label">
          Status
          <select className="input-control" name="status" onChange={handleChange} value={form.status}>
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          {errors.status && <span className="field-error">{errors.status}</span>}
        </label>
      </div>

      <button className="btn-primary mt-5 w-full justify-center" disabled={submitting} type="submit">
        {submitting ? <FiRefreshCw className="animate-spin" aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
        {submitting ? 'Saving Lead' : 'Add Lead'}
      </button>
    </form>
  );
}

function SearchFilters({ filters, setFilters, onRefresh, loading }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label="Search and filters">
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
        <label className="relative">
          <span className="sr-only">Search by name or phone</span>
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-control pl-10"
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search name or phone"
            value={filters.search}
          />
        </label>

        <label>
          <span className="sr-only">Filter by status</span>
          <select
            className="input-control"
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            value={filters.status}
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Filter by source</span>
          <select
            className="input-control"
            onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}
            value={filters.source}
          >
            <option value="">All sources</option>
            {SOURCES.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </label>

        <button className="btn-secondary justify-center" disabled={loading} onClick={onRefresh} type="button">
          {loading ? <FiRefreshCw className="animate-spin" aria-hidden="true" /> : <FiFilter aria-hidden="true" />}
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
        <p className="mt-1 max-w-sm text-sm text-slate-500">Add a lead or adjust the filters to rebuild the view.</p>
      </div>
    </div>
  );
}

function LeadTable({ leads, loading, onStatusChange, onDelete, pendingId }) {
  if (!loading && leads.length === 0) return <EmptyState />;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Leads list">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Lead', 'Phone', 'Source', 'Status', 'Created', 'Actions'].map((header) => (
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
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
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
                      <p className="text-xs text-slate-500">ID #{lead.id}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">{lead.phone}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{lead.source}</td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-48 flex-col gap-2">
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
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-4">
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
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, interested: 0, converted: 0, notInterested: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', source: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const queryFilters = useMemo(
    () => ({
      search: filters.search.trim(),
      status: filters.status,
      source: filters.source,
    }),
    [filters],
  );

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(window.__leadflowToast);
    window.__leadflowToast = window.setTimeout(() => setToast(null), 3200);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRows, statRows] = await Promise.all([getLeads(queryFilters), getStats()]);
      setLeads(leadRows);
      setStats(statRows);
    } catch {
      notify('Could not load leads. Check that the API server is running.', 'error');
    } finally {
      setLoading(false);
    }
  }, [queryFilters]);

  useEffect(() => {
    const timeout = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setErrors({});
    try {
      await createLead(payload);
      notify('Lead added successfully.');
      await loadData();
      return true;
    } catch (error) {
      const responseErrors = error.response?.data?.errors || {};
      setErrors(responseErrors);
      notify(error.response?.data?.message || 'Could not add lead.', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setPendingId(id);
    const previous = leads;
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    try {
      await updateLeadStatus(id, status);
      notify('Status updated instantly.');
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

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-3">
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-700">Lead management system</p>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Track every lead from first touch to conversion.
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">
                A fast mini CRM for small teams that need clean lead capture, quick status updates, and a pipeline they
                can trust.
              </p>
            </div>
            <button className="btn-secondary self-start lg:self-auto" onClick={loadData} type="button">
              <FiRefreshCw className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              Sync
            </button>
          </div>
        </section>

        <DashboardCards stats={stats} loading={loading} />

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="xl:sticky xl:top-24 xl:self-start">
            <LeadForm errors={errors} onCreate={handleCreate} submitting={submitting} />
          </div>

          <div className="grid gap-4">
            <SearchFilters filters={filters} loading={loading} onRefresh={loadData} setFilters={setFilters} />
            <LeadTable
              leads={leads}
              loading={loading}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              pendingId={pendingId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
