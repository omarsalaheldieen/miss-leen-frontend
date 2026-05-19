import client from './client';
const BASE = '/salary';
export const salaryApi = {
  getAll:        (month)    => client.get(BASE, { params: month ? { month } : {} }).then(r => r.data),
  getByEmployee: (id)       => client.get(`${BASE}/employee/${id}`).then(r => r.data),
  getMonths:     ()         => client.get(`${BASE}/months`).then(r => r.data),
  getFridays:    (month)    => client.get(`${BASE}/fridays/${month}`).then(r => r.data),
  create:        (data)     => client.post(BASE, data).then(r => r.data),
  update:        (id, data) => client.put(`${BASE}/${id}`, data).then(r => r.data),
  remove:        (id)       => client.delete(`${BASE}/${id}`).then(r => r.data),
};
