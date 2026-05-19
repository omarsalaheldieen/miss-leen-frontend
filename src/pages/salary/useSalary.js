import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { currentMonth, countFridaysInMonth } from '../../utils/formatters';

export const WORK_DAYS       = 26;
export const EXTRA_HOUR_RATE = 30;

export const EMPTY_FORM = {
  employee_id: '', month: '', absent_days: '0', extra_hours: '0',
  friday_days: '0', cash_advance: '0', notes: '',
};

export function calcSalary({ daily_wage, absent_days, extra_hours, friday_days, cash_advance }) {
  const dw      = Number(daily_wage)   || 0;
  const absent  = Number(absent_days)  || 0;
  const extra   = Number(extra_hours)  || 0;
  const fridays = Number(friday_days)  || 0;
  const advance = Number(cash_advance) || 0;
  const base_salary       = dw * WORK_DAYS;
  const friday_pay        = dw * fridays;
  const absence_deduction = dw * absent;
  const extra_pay         = extra * EXTRA_HOUR_RATE;
  return { base_salary, friday_pay, absence_deduction, extra_pay, cash_advance: advance, net_salary: base_salary + friday_pay - absence_deduction + extra_pay - advance, actual_days: WORK_DAYS + fridays - absent };
}

export function useSalary() {
  const [records,      setRecords]      = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterMonth,  setFilterMonth]  = useState(currentMonth());
  const [searchEmp,    setSearchEmp]    = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [attLoading,   setAttLoading]   = useState(false);
  const [attSource,    setAttSource]    = useState(null);
  const [advLoading,   setAdvLoading]   = useState(false);
  const [advTotal,     setAdvTotal]     = useState(0);
  const [bulkModal,    setBulkModal]    = useState(false);
  const [bulkSaving,   setBulkSaving]   = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, errors: [] });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const totalFridaysInMonth = countFridaysInMonth(form.month);

  const selectedEmp = useMemo(() => employees.find(e => String(e.id) === String(form.employee_id)), [employees, form.employee_id]);

  const preview = useMemo(() => selectedEmp ? calcSalary({ daily_wage: selectedEmp.daily_wage, absent_days: form.absent_days, extra_hours: form.extra_hours, friday_days: form.friday_days, cash_advance: form.cash_advance }) : null,
    [selectedEmp, form.absent_days, form.extra_hours, form.friday_days, form.cash_advance]);

  const filteredRecords = useMemo(() => {
    if (!searchEmp.trim()) return records;
    const q = searchEmp.trim().toLowerCase();
    return records.filter(r => r.employee_name?.toLowerCase().includes(q));
  }, [records, searchEmp]);

  const { recordedIds, unrecorded, totals } = useMemo(() => {
    const recordedIds = new Set(records.map(r => r.employee_id));
    const unrecorded  = employees.filter(e => !recordedIds.has(e.id));
    const totals = { net: records.reduce((s, r) => s + r.net_salary, 0), base: records.reduce((s, r) => s + r.base_salary, 0), deduction: records.reduce((s, r) => s + r.absence_deduction, 0), extra: records.reduce((s, r) => s + r.extra_pay, 0), friday: records.reduce((s, r) => s + (r.friday_pay || 0), 0), advance: records.reduce((s, r) => s + (r.cash_advance || 0), 0) };
    return { recordedIds, unrecorded, totals };
  }, [records, employees]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, empRes] = await Promise.all([
        axios.get('/api/salary', { params: filterMonth ? { month: filterMonth } : {} }),
        axios.get('/api/employees'),
      ]);
      setRecords(recRes.data); setEmployees(empRes.data);
    } catch { toast.error('فشل في تحميل البيانات'); }
    finally { setLoading(false); }
  }, [filterMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const max = countFridaysInMonth(form.month);
    if (Number(form.friday_days) > max) setForm(f => ({ ...f, friday_days: String(max) }));
  }, [form.month]);

  useEffect(() => {
    if (editItem || !form.employee_id || !form.month) return;
    let cancelled = false;
    const load = async () => {
      setAttLoading(true);
      try {
        const res = await axios.get(`/api/attendance/summary/${form.month}`);
        if (cancelled) return;
        const row = res.data.find(r => String(r.employee_id) === String(form.employee_id));
        if (row && row.total_recorded > 0) { setForm(f => ({ ...f, absent_days: String(row.absent_days || 0), friday_days: String(row.friday_present_days || 0) })); setAttSource('attendance'); }
        else setAttSource(null);
      } catch { if (!cancelled) setAttSource(null); }
      finally { if (!cancelled) setAttLoading(false); }
    };
    load(); return () => { cancelled = true; };
  }, [form.employee_id, form.month, editItem]);

  useEffect(() => {
    if (editItem || !form.employee_id || !form.month) return;
    let cancelled = false;
    const load = async () => {
      setAdvLoading(true);
      try {
        const res = await axios.get(`/api/cash-advances/totals/${form.month}`);
        if (cancelled) return;
        const row = res.data.find(r => String(r.employee_id) === String(form.employee_id));
        const total = row ? row.total_advance : 0;
        setAdvTotal(total); setForm(f => ({ ...f, cash_advance: String(total) }));
      } catch { if (!cancelled) setAdvTotal(0); }
      finally { if (!cancelled) setAdvLoading(false); }
    };
    load(); return () => { cancelled = true; };
  }, [form.employee_id, form.month, editItem]);

  const openAdd  = () => { setEditItem(null); setAttSource(null); setAdvTotal(0); setForm({ ...EMPTY_FORM, month: filterMonth || currentMonth() }); setShowModal(true); };
  const openEdit = (rec) => { setEditItem(rec); setAttSource(null); setAdvTotal(rec.cash_advance || 0); setForm({ employee_id: String(rec.employee_id), month: rec.month, absent_days: String(rec.absent_days), extra_hours: String(rec.extra_hours), friday_days: String(rec.friday_days ?? 0), cash_advance: String(rec.cash_advance ?? 0), notes: rec.notes || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditItem(null); setAttSource(null); setAdvTotal(0); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.month) return toast.error('اختر الموظف والشهر');
    const absent = Number(form.absent_days) || 0, fridays = Number(form.friday_days) || 0;
    if (absent < 0 || absent > WORK_DAYS) return toast.error(`أيام الغياب يجب أن تكون بين 0 و ${WORK_DAYS}`);
    if (fridays < 0 || fridays > totalFridaysInMonth) return toast.error(`أيام الجمعة لا يمكن أن تتجاوز ${totalFridaysInMonth}`);
    setSaving(true);
    try {
      const payload = { employee_id: Number(form.employee_id), month: form.month, absent_days: absent, extra_hours: Number(form.extra_hours) || 0, friday_days: fridays, cash_advance: Number(form.cash_advance) || 0, notes: form.notes };
      if (editItem) { await axios.put(`/api/salary/${editItem.id}`, payload); toast.success('تم تعديل السجل بنجاح'); }
      else { await axios.post('/api/salary', payload); toast.success('تم حفظ الراتب بنجاح'); }
      closeModal(); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await axios.delete(`/api/salary/${deleteTarget.id}`); toast.success('تم حذف السجل'); setDeleteTarget(null); fetchAll(); }
    catch { toast.error('فشل في الحذف'); }
    finally { setDeleting(false); }
  };

  const openBulkModal = () => { setBulkProgress({ done: 0, total: 0, errors: [] }); setBulkModal(true); };

  const handleBulkSave = async () => {
    const month = filterMonth || currentMonth();
    const toAdd = employees.filter(e => !recordedIds.has(e.id));
    if (toAdd.length === 0) return toast.error('جميع الموظفين مسجلة رواتبهم بالفعل في هذا الشهر');
    setBulkSaving(true); setBulkProgress({ done: 0, total: toAdd.length, errors: [] });
    let attMap = {}, advMap = {};
    try { const [a, b] = await Promise.all([axios.get(`/api/attendance/summary/${month}`), axios.get(`/api/cash-advances/totals/${month}`)]); a.data.forEach(r => { attMap[r.employee_id] = r; }); b.data.forEach(r => { advMap[r.employee_id] = r.total_advance || 0; }); } catch {}
    const maxFridays = countFridaysInMonth(month); let done = 0;
    for (const emp of toAdd) {
      const att = attMap[emp.id];
      try { await axios.post('/api/salary', { employee_id: emp.id, month, absent_days: att ? (att.absent_days || 0) : 0, extra_hours: 0, friday_days: att ? Math.min(att.friday_present_days || 0, maxFridays) : 0, cash_advance: advMap[emp.id] || 0, notes: '' }); done++; setBulkProgress(p => ({ ...p, done })); }
      catch (err) { const msg = err?.response?.data?.message || 'خطأ'; setBulkProgress(p => ({ ...p, errors: [...p.errors, { name: emp.name, msg }] })); }
    }
    setBulkSaving(false);
    if (done === toAdd.length) { toast.success(`✅ تم إضافة رواتب ${done} موظف بنجاح`); setBulkModal(false); }
    else toast.error(`تم إضافة ${done} من أصل ${toAdd.length}`);
    fetchAll();
  };

  return { records, employees, loading, filterMonth, setFilterMonth, searchEmp, setSearchEmp, filteredRecords, showModal, editItem, form, setForm, saving, attLoading, attSource, setAttSource, advLoading, advTotal, totalFridaysInMonth, selectedEmp, preview, recordedIds, unrecorded, totals, bulkModal, setBulkModal, bulkSaving, bulkProgress, deleteTarget, setDeleteTarget, deleting, fetchAll, openAdd, openEdit, closeModal, handleSave, handleDelete, openBulkModal, handleBulkSave };
}
