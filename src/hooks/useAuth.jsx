import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('ml_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      client.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await client.post('/auth/login', { username, password }).then(r => r.data);
    const { token: t, user: u } = data;
    localStorage.setItem('ml_token', t);
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    setToken(t); setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('ml_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null); setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  const hasPermission = (perm) => {
    if (!user) return false;
    if (isAdmin) return true;
    const perms = user.permissions || [];
    return perms.includes('all') || perms.includes(perm);
  };

  const hasAnyPermission = (...perms) => {
    if (!user) return false;
    if (isAdmin) return true;
    return perms.some(p => hasPermission(p));
  };

  const getHomePage = () => {
    if (isAdmin) return '/employees';
    if (hasAnyPermission('view_employees', 'manage_employees')) return '/employees';
    if (hasAnyPermission('view_attendance', 'manage_attendance')) return '/attendance';
    if (hasAnyPermission('view_salary', 'manage_salary')) return '/salary';
    return '/no-access';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, hasPermission, hasAnyPermission, getHomePage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
