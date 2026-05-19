import client from './client';
const BASE = '/users';
export const usersApi = {
  getAll:         ()           => client.get(BASE).then(r => r.data),
  getPermissions: ()           => client.get(`${BASE}/permissions`).then(r => r.data),
  create:         (data)       => client.post(BASE, data).then(r => r.data),
  update:         (id, data)   => client.put(`${BASE}/${id}`, data).then(r => r.data),
  remove:         (id)         => client.delete(`${BASE}/${id}`).then(r => r.data),
};
export const authApi = {
  login: (credentials) => client.post('/auth/login', credentials).then(r => r.data),
  getMe: ()            => client.get('/auth/me').then(r => r.data),
};
