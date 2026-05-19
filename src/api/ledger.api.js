import client from './client';
const BASE = '/ledger';
export const ledgerApi = {
  getSummary:        ()           => client.get(`${BASE}/summary`).then(r => r.data),
  getParties:        (params)     => client.get(`${BASE}/parties`, { params }).then(r => r.data),
  getPartyById:      (id)         => client.get(`${BASE}/parties/${id}`).then(r => r.data),
  createParty:       (data)       => client.post(`${BASE}/parties`, data).then(r => r.data),
  updateParty:       (id, data)   => client.put(`${BASE}/parties/${id}`, data).then(r => r.data),
  removeParty:       (id)         => client.delete(`${BASE}/parties/${id}`).then(r => r.data),
  getTransactions:   (params)     => client.get(`${BASE}/transactions`, { params }).then(r => r.data),
  createTransaction: (data)       => client.post(`${BASE}/transactions`, data).then(r => r.data),
  updateTransaction: (id, data)   => client.put(`${BASE}/transactions/${id}`, data).then(r => r.data),
  removeTransaction: (id)         => client.delete(`${BASE}/transactions/${id}`).then(r => r.data),
};
