import client from './client';
const BASE = '/cash-advances';
export const cashAdvancesApi = {
  getAll:        (params)    => client.get(BASE, { params }).then(r => r.data),
  getTotals:     (month)     => client.get(`${BASE}/totals/${month}`).then(r => r.data),
  getByEmployee: (id)        => client.get(`${BASE}/employee/${id}`).then(r => r.data),
  create:        (data)      => client.post(BASE, data).then(r => r.data),
  update:        (id, data)  => client.put(`${BASE}/${id}`, data).then(r => r.data),
  remove:        (id)        => client.delete(`${BASE}/${id}`).then(r => r.data),
};
