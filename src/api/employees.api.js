import client from './client';
const BASE = '/employees';
export const employeesApi = {
  getAll:  ()         => client.get(BASE).then(r => r.data),
  getById: (id)       => client.get(`${BASE}/${id}`).then(r => r.data),
  create:  (data)     => client.post(BASE, data).then(r => r.data),
  update:  (id, data) => client.put(`${BASE}/${id}`, data).then(r => r.data),
  remove:  (id)       => client.delete(`${BASE}/${id}`).then(r => r.data),
};
