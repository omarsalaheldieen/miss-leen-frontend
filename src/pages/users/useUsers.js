import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DEPS, PERMISSION_GROUPS } from '../../utils/permissions';

const EMPTY_FORM = { username: '', password: '', full_name: '', role: 'viewer', permissions: [], is_active: true };

export function useUsers() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch { toast.error('فشل في تحميل المستخدمين'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (u) => {
    setEditItem(u);
    setForm({ username: u.username, password: '', full_name: u.full_name, role: u.role, permissions: u.permissions || [], is_active: !!u.is_active });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(EMPTY_FORM); };

  const togglePerm = (key) => {
    setForm(f => {
      const has = f.permissions.includes(key);
      if (has) {
        const dependants = Object.entries(DEPS).filter(([, deps]) => deps.includes(key)).map(([k]) => k);
        return { ...f, permissions: f.permissions.filter(p => p !== key && !dependants.includes(p)) };
      } else {
        const deps = DEPS[key] || [];
        return { ...f, permissions: [...new Set([...f.permissions, key, ...deps])] };
      }
    });
  };

  const toggleGroup = (groupPerms) => {
    const keys   = groupPerms.map(p => p.key);
    const allOn  = keys.every(k => form.permissions.includes(k));
    setForm(f => {
      if (allOn) {
        const dependants = keys.flatMap(k => Object.entries(DEPS).filter(([, deps]) => deps.includes(k)).map(([dk]) => dk));
        return { ...f, permissions: f.permissions.filter(p => !keys.includes(p) && !dependants.includes(p)) };
      } else {
        const deps = keys.flatMap(k => DEPS[k] || []);
        return { ...f, permissions: [...new Set([...f.permissions, ...keys, ...deps])] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || (!editItem && (!form.username.trim() || !form.password.trim())))
      return toast.error('يرجى ملء جميع الحقول المطلوبة');
    setSaving(true);
    try {
      if (editItem) { await axios.put(`/api/users/${editItem.id}`, form); toast.success('تم تعديل المستخدم بنجاح'); }
      else { await axios.post('/api/users', form); toast.success('تم إنشاء المستخدم بنجاح'); }
      closeModal(); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/users/${deleteTarget.id}`);
      toast.success('تم حذف المستخدم'); setDeleteTarget(null); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل في الحذف'); }
    finally { setDeleting(false); }
  };

  const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions);
  const permLabel = (key) => ALL_PERMISSIONS.find(p => p.key === key)?.label || key;
  const permGroup = (key) => PERMISSION_GROUPS.find(g => g.permissions.some(p => p.key === key));

  return { users, loading, showModal, editItem, form, setForm, saving, deleteTarget, setDeleteTarget, deleting, PERMISSION_GROUPS, openAdd, openEdit, closeModal, togglePerm, toggleGroup, handleSave, handleDelete, permLabel, permGroup };
}
