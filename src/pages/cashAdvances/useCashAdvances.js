import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { currentMonth, todayDate } from '../../utils/formatters';

const EMPTY_FORM = { employee_id: '', amount: '', month: '', date: todayDate(), reason: '' };

export function useCashAdvances() {
  const [advances,     setAdvances]     = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterMonth,  setFilterMonth]  = useState(currentMonth());
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [advRes, empRes] = await Promise.all([
        axios.get('/api/cash-advances', { params: filterMonth ? { month: filterMonth } : {} }),
        axios.get('/api/employees'),
      ]);
      setAdvances(advRes.data);
      setEmployees(empRes.data);
    } catch { toast.error('فشل في تحميل البيانات'); }
    finally { setLoading(false); }
  }, [filterMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, month: filterMonth || currentMonth(), date: todayDate() });
    setShowModal(true);
  };
  const openEdit = (adv) => {
    setEditItem(adv);
    setForm({ employee_id: String(adv.employee_id), amount: String(adv.amount), month: adv.month, date: adv.date, reason: adv.reason || '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.amount || !form.month || !form.date)
      return toast.error('يرجى ملء جميع الحقول المطلوبة');
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return toast.error('المبلغ يجب أن يكون رقماً أكبر من صفر');
    setSaving(true);
    try {
      const payload = { employee_id: Number(form.employee_id), amount: Number(form.amount), month: form.month, date: form.date, reason: form.reason };
      if (editItem) {
        await axios.put(`/api/cash-advances/${editItem.id}`, payload);
        toast.success('تم تعديل السلفة بنجاح');
      } else {
        await axios.post('/api/cash-advances', payload);
        toast.success('تم تسجيل السلفة بنجاح');
      }
      closeModal(); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/cash-advances/${deleteTarget.id}`);
      toast.success('تم حذف السلفة'); setDeleteTarget(null); fetchAll();
    } catch { toast.error('فشل في الحذف'); }
    finally { setDeleting(false); }
  };

  const totalAdvance = advances.reduce((s, a) => s + a.amount, 0);
  const byEmployee   = advances.reduce((acc, a) => { acc[a.employee_id] = (acc[a.employee_id] || 0) + a.amount; return acc; }, {});
  const topBorrower  = Object.entries(byEmployee).sort((a, b) => b[1] - a[1])[0];
  const topEmp       = topBorrower ? employees.find(e => String(e.id) === String(topBorrower[0])) : null;

  return { advances, employees, loading, filterMonth, setFilterMonth, showModal, editItem, form, setForm, saving, deleteTarget, setDeleteTarget, deleting, totalAdvance, byEmployee, topBorrower, topEmp, openAdd, openEdit, closeModal, handleSave, handleDelete };
}
