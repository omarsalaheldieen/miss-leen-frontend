import client from './client';
const BASE = '/attendance';
export const attendanceApi = {
  getByMonth: (month) => client.get(BASE, { params: { month } }).then(r => r.data),
  getByDay:   (date)  => client.get(`${BASE}/day/${date}`).then(r => r.data),
  getSummary: (month) => client.get(`${BASE}/summary/${month}`).then(r => r.data),
  upsert:     (data)  => client.post(BASE, data).then(r => r.data),
  upsertBulk: (data)  => client.post(`${BASE}/bulk`, data).then(r => r.data),
  remove:     (id)    => client.delete(`${BASE}/${id}`).then(r => r.data),
};
