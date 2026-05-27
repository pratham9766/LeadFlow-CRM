import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
});

export async function getLeads(filters) {
  const { data } = await api.get('/leads', { params: filters });
  return data.leads;
}

export async function createLead(payload) {
  const { data } = await api.post('/leads', payload);
  return data.lead;
}

export async function updateLeadStatus(id, status) {
  const { data } = await api.put(`/leads/${id}`, { status });
  return data.lead;
}

export async function deleteLead(id) {
  await api.delete(`/leads/${id}`);
}

export async function getStats() {
  const { data } = await api.get('/leads/stats');
  return data.stats;
}
