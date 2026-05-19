import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUsers } from './useUsers';
// Re-export the monolithic file split for Users — UI lives in UsersUI.jsx
import UsersPageUI from './UsersPageUI';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();

  useEffect(() => { if (!isAdmin) navigate('/'); }, [isAdmin]);

  const ctx = useUsers();

  return <UsersPageUI ctx={ctx} />;
}
