import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const WORK_DAYS = 26;
const EMPTY_FORM = { name: '', phone: '', gender: '', daily_wage: '', department: '', notes: '' };

export function useEmployees() {
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch {
      toast.error('فشل في تحميل بيانات الموظفين');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (emp) => {
    setEditItem(emp);
    setForm({ name: emp.name, phone: emp.phone, gender: emp.gender, daily_wage: String(emp.daily_wage), department: emp.department || '', notes: emp.notes || '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.gender || !form.daily_wage)
      return toast.error('يرجى ملء جميع الحقول المطلوبة');
    setSaving(true);
    try {
      const payload = { ...form, daily_wage: Number(form.daily_wage) };
      if (editItem) {
        await axios.put(`/api/employees/${editItem.id}`, payload);
        toast.success('تم تعديل بيانات الموظف بنجاح');
      } else {
        await axios.post('/api/employees', payload);
        toast.success('تم إضافة الموظف بنجاح');
      }
      closeModal(); fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/employees/${deleteTarget.id}`);
      toast.success('تم حذف الموظف بنجاح');
      setDeleteTarget(null); fetchAll();
    } catch {
      toast.error('فشل في حذف الموظف');
    } finally {
      setDeleting(false);
    }
  };

  const filtered      = employees.filter(e => e.name.includes(search) || e.phone.includes(search) || (e.department || '').includes(search));
  const totalMonthly  = employees.reduce((sum, e) => sum + e.daily_wage * WORK_DAYS, 0);

  return { employees, filtered, loading, totalMonthly, WORK_DAYS, search, setSearch, showModal, editItem, form, setForm, saving, deleteTarget, setDeleteTarget, deleting, openAdd, openEdit, closeModal, handleSave, handleDelete };
}
