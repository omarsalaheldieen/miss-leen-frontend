import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.jsx';
import { NoAccess } from './NoAccess';
import logoSrc from '../assets/logo.png';
import { fmt, formatMonth, currentMonth, countFridaysInMonth } from '../utils/formatters';

// ─── Constants ────────────────────────────────────────────────────────────────

const WORK_DAYS       = 26;
const EXTRA_HOUR_RATE = 30;

const EMPTY_FORM = {
  employee_id: '',
  month:       '',
  absent_days: '0',
  extra_hours: '0',
  friday_days: '0',
  cash_advance: '0',
  notes:       '',
};

// ─── Pure salary calculator (mirrors backend calcSalary) ─────────────────────

function calcSalary({ daily_wage, absent_days, extra_hours, friday_days, cash_advance }) {
  const dw      = Number(daily_wage)   || 0;
  const absent  = Number(absent_days)  || 0;
  const extra   = Number(extra_hours)  || 0;
  const fridays = Number(friday_days)  || 0;
  const advance = Number(cash_advance) || 0;

  const base_salary       = dw * WORK_DAYS;
  const friday_pay        = dw * fridays;
  const absence_deduction = dw * absent;
  const extra_pay         = extra * EXTRA_HOUR_RATE;

  return {
    base_salary,
    friday_pay,
    absence_deduction,
    extra_pay,
    cash_advance: advance,
    net_salary:   base_salary + friday_pay - absence_deduction + extra_pay - advance,
    actual_days:  WORK_DAYS + fridays - absent,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, icon, minus = false, highlight = false }) {
  return (
    <div style={{ ...s.summaryCard, ...(highlight ? s.summaryCardHighlight : {}) }}>
      <div style={{ ...s.summaryIcon, background: `${color}20` }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: highlight ? '#fff' : color, lineHeight: 1.2 }}>
          {minus && value > 0 ? '- ' : ''}{fmt(value)} ج.م
        </div>
        <div style={{ fontSize: 12, color: highlight ? '#aaa' : '#999', marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={s.field}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function PreviewRow({ label, value, color = '#1A1A1A' }) {
  return (
    <div style={s.previewRow}>
      <span style={{ fontSize: 14, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function Modal({ title, onClose, children, small = false }) {
  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalBox, maxWidth: small ? 440 : 760 }}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>{title}</h3>
          <button onClick={onClose} style={s.modalCloseBtn} aria-label="إغلاق">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={s.modalBody}>{children}</div>
      </div>
    </div>
  );
}

function LoadingSpinner({ text = 'جارٍ التحميل...' }) {
  return (
    <div style={s.centered}>
      <div style={s.spinner} />
      <p style={{ color: '#999', marginTop: 14 }}>{text}</p>
    </div>
  );
}

// ─── Print helper ─────────────────────────────────────────────────────────────

function buildPrintHtml({ records, filterMonth }) {
  const monthLabel = filterMonth ? formatMonth(filterMonth) : 'جميع الأشهر';
  const printDate  = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const tNet     = records.reduce((s, r) => s + r.net_salary, 0);
  const tBase    = records.reduce((s, r) => s + r.base_salary, 0);
  const tDeduct  = records.reduce((s, r) => s + r.absence_deduction, 0);
  const tExtra   = records.reduce((s, r) => s + r.extra_pay, 0);
  const tFriday  = records.reduce((s, r) => s + (r.friday_pay || 0), 0);
  const tAdvance = records.reduce((s, r) => s + (r.cash_advance || 0), 0);

  const bodyRows = records.map((rec, idx) => {
    const days = WORK_DAYS + (rec.friday_days || 0) - (rec.absent_days || 0);
    const chips = [
      `<span class="ch base">أساسي ${fmt(rec.base_salary)}</span>`,
      ...(rec.friday_pay > 0         ? [`<span class="ch fri">+جمعة ${fmt(rec.friday_pay)}</span>`]         : []),
      ...(rec.extra_pay > 0          ? [`<span class="ch ext">+إضافي ${fmt(rec.extra_pay)}</span>`]          : []),
      ...(rec.absence_deduction > 0  ? [`<span class="ch abs">−غياب ${fmt(rec.absence_deduction)}</span>`]  : []),
      ...((rec.cash_advance || 0) > 0 ? [`<span class="ch adv">−سلفة ${fmt(rec.cash_advance)}</span>`]     : []),
    ];
    const counts = [
      rec.absent_days > 0
        ? `<span class="cnt abs">غياب ${rec.absent_days} يوم</span>`
        : `<span class="cnt ok">لا غياب</span>`,
      ...((rec.friday_days || 0) > 0 ? [`<span class="cnt fri">جمعة ${rec.friday_days} يوم</span>`] : []),
      ...(rec.extra_hours > 0        ? [`<span class="cnt ext">إضافي ${rec.extra_hours} ساعة</span>`] : []),
    ];
    return `
      <tr class="er">
        <td class="t num">${idx + 1}</td>
        <td class="t nm"><span class="en">${rec.employee_name}</span>${rec.department ? `<span class="ed">${rec.department}</span>` : ''}</td>
        <td class="t ct">${days}</td>
        <td class="t ch-cell">
          <div class="chips-row">${chips.join('')}</div>
          <div class="counts-row">${counts.join('')}</div>
        </td>
        <td class="t nt">${fmt(rec.net_salary)} ج.م</td>
        <td class="t sg"></td>
      </tr>
      ${rec.notes ? `<tr class="nr"><td colspan="6" class="nc">ملاحظة: ${rec.notes}</td></tr>` : ''}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"/>
<title>كشف رواتب — ${monthLabel}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Cairo',sans-serif;direction:rtl;background:#fff;color:#111;font-size:13px;}
.pg{max-width:210mm;margin:0 auto;padding:9mm 9mm 7mm;}
.hdr{display:flex;align-items:center;justify-content:space-between;padding-bottom:9px;border-bottom:3px solid #CC1010;margin-bottom:10px;}
.hdr img{max-height:52px;max-width:140px;object-fit:contain;}
.hc{text-align:center;flex:1;padding:0 14px;}
.ht{font-size:18px;font-weight:900;color:#CC1010;}
.hm{font-size:13px;font-weight:700;color:#555;margin-top:2px;}
.hx{text-align:left;font-size:11px;color:#888;line-height:1.7;}
.sm{display:flex;border:1px solid #DDD;border-radius:6px;overflow:hidden;margin-bottom:10px;}
.si{flex:1;padding:6px 8px;text-align:center;border-right:1px solid #DDD;}
.si:last-child{border-right:none;}
.si.hl{background:#1A1A1A;}
.sl{font-size:10px;color:#999;font-weight:600;margin-bottom:2px;}
.sl.w{color:#bbb;}
.sv{font-size:12.5px;font-weight:800;color:#222;}
.sv.r{color:#CC1010;}.sv.g{color:#0A7A4E;}.sv.p{color:#7B2FBE;}.sv.a{color:#B45309;}.sv.w{color:#fff;}
table{width:100%;border-collapse:collapse;}
thead th{background:#1A1A1A;color:#fff;padding:8px 10px;font-size:11.5px;font-weight:700;text-align:right;white-space:nowrap;}
thead th.ct{text-align:center;}
tr.er:nth-child(odd) td{background:#F9F9F9;}
tr.er:nth-child(even) td{background:#fff;}
td.t{padding:8px 10px;border-bottom:1px solid #EDEDED;vertical-align:middle;}
td.num{font-size:11px;color:#CCC;width:26px;text-align:center;font-weight:700;}
td.nm{min-width:90px;max-width:130px;}
td.ct{text-align:center;font-weight:800;color:#444;width:48px;font-size:13px;}
td.nt{text-align:center;font-weight:900;font-size:14px;color:#CC1010;white-space:nowrap;width:105px;border-right:2px solid rgba(204,16,16,0.15);}
td.sg{width:82px;border-right:1px dashed #DDD;text-align:center;}
.en{font-weight:800;font-size:13px;color:#111;display:block;}
.ed{font-size:10px;color:#AAA;margin-top:1px;display:block;}
.chips-row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px;}
.ch{display:inline-flex;padding:3px 9px;border-radius:99px;font-size:11.5px;font-weight:700;white-space:nowrap;}
.ch.base{background:#EBF5FF;color:#1A6EB0;}
.ch.fri{background:#F3E8FF;color:#7B2FBE;}
.ch.ext{background:#E8F8F0;color:#0A7A4E;}
.ch.abs{background:#FFF0F0;color:#CC1010;}
.ch.adv{background:#FFF8EC;color:#B45309;}
.counts-row{display:flex;flex-wrap:wrap;gap:4px;}
.cnt{display:inline-flex;padding:2px 8px;border-radius:5px;font-size:10.5px;font-weight:600;white-space:nowrap;}
.cnt.abs{background:#FFF0F0;color:#CC1010;}
.cnt.ok{background:#E8F8F0;color:#0A7A4E;}
.cnt.fri{background:#F3E8FF;color:#7B2FBE;}
.cnt.ext{background:#E8F8F0;color:#0A7A4E;}
tr.nr td{background:#FFFBEB!important;}
.nc{font-size:10.5px;color:#92400E;padding:3px 10px 4px;border-bottom:1px solid #FEE2A0;}
tfoot td{background:#1A1A1A;color:#888;padding:8px 10px;font-size:11.5px;font-weight:700;}
tfoot td.nt{color:#CC1010;font-size:14px;}
.sl2{width:100px;border-bottom:1px solid #CCC;margin:0 auto 2px;}
.slt{font-size:10px;color:#AAA;text-align:center;}
.ft{display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#AAA;padding-top:7px;border-top:1px solid #DDD;margin-top:8px;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.np{display:none!important;}.pg{padding:5mm 6mm;}tr.er{break-inside:avoid;page-break-inside:avoid;}}
</style></head><body>
<div class="pg">
  <div class="hdr">
    <img src="${logoSrc}" alt="logo"/>
    <div class="hc"><div class="ht">كشف رواتب الموظفين</div><div class="hm">${monthLabel}</div></div>
    <div class="hx"><div>طباعة: ${printDate}</div><div>عدد الموظفين: <strong>${records.length}</strong></div><div>سعر الساعة الإضافية: <strong>${EXTRA_HOUR_RATE} ج.م</strong></div></div>
  </div>
  <div class="sm">
    <div class="si"><div class="sl">أساسي</div><div class="sv">${fmt(tBase)} ج.م</div></div>
    ${tFriday  > 0 ? `<div class="si"><div class="sl">جمعة</div><div class="sv p">+${fmt(tFriday)} ج.م</div></div>` : ''}
    ${tExtra   > 0 ? `<div class="si"><div class="sl">إضافي</div><div class="sv g">+${fmt(tExtra)} ج.م</div></div>` : ''}
    ${tDeduct  > 0 ? `<div class="si"><div class="sl">غياب</div><div class="sv r">−${fmt(tDeduct)} ج.م</div></div>` : ''}
    ${tAdvance > 0 ? `<div class="si"><div class="sl">سلف</div><div class="sv a">−${fmt(tAdvance)} ج.م</div></div>` : ''}
    <div class="si hl"><div class="sl w">صافي الرواتب</div><div class="sv w">${fmt(tNet)} ج.م</div></div>
  </div>
  <table>
    <thead><tr>
      <th class="ct">#</th><th>الموظف</th><th class="ct">أيام</th>
      <th>تفاصيل الراتب</th><th class="ct">الصافي (ج.م)</th><th class="ct">توقيع الموظف</th>
    </tr></thead>
    <tbody>${bodyRows}</tbody>
    <tfoot><tr>
      <td colspan="3">الإجمالي — ${records.length} موظف — شهر ${monthLabel}</td>
      <td></td>
      <td class="nt ct">${fmt(tNet)} ج.م</td>
      <td style="text-align:center"><div class="sl2"></div><div class="slt">توقيع المدير</div></td>
    </tr></tfoot>
  </table>
  <div class="ft"><span>نظام Miss Leen — إدارة المصنع</span><span>بتاريخ: ${printDate}</span></div>
</div>
<div class="np" style="position:fixed;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:999;">
  <button onclick="window.print()" style="padding:11px 26px;background:#CC1010;color:#fff;border:none;border-radius:9px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">طباعة / تصدير PDF</button>
  <button onclick="window.close()" style="padding:11px 22px;background:#fff;color:#555;border:1.5px solid #DDD;border-radius:9px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">إغلاق</button>
</div>
<script>window.addEventListener('afterprint',()=>window.close());<\/script>
</body></html>`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SalaryPage() {
  const { hasPermission, hasAnyPermission } = useAuth();

  if (!hasAnyPermission('view_salary', 'manage_salary')) {
    return <NoAccess page="الرواتب" />;
  }
  const canManage = hasPermission('manage_salary');

  // ── State ──────────────────────────────────────────────────────────────────
  const [records,      setRecords]      = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterMonth,  setFilterMonth]  = useState(currentMonth());
  const [searchEmp,    setSearchEmp]    = useState('');

  // Single-record modal
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [attLoading,   setAttLoading]   = useState(false);
  const [attSource,    setAttSource]    = useState(null);
  const [advLoading,   setAdvLoading]   = useState(false);
  const [advTotal,     setAdvTotal]     = useState(0);

  // Bulk modal
  const [bulkModal,    setBulkModal]    = useState(false);
  const [bulkSaving,   setBulkSaving]   = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, errors: [] });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalFridaysInMonth = countFridaysInMonth(form.month);

  const selectedEmp = useMemo(
    () => employees.find(e => String(e.id) === String(form.employee_id)),
    [employees, form.employee_id]
  );

  const preview = useMemo(
    () => selectedEmp
      ? calcSalary({
          daily_wage:   selectedEmp.daily_wage,
          absent_days:  form.absent_days,
          extra_hours:  form.extra_hours,
          friday_days:  form.friday_days,
          cash_advance: form.cash_advance,
        })
      : null,
    [selectedEmp, form.absent_days, form.extra_hours, form.friday_days, form.cash_advance]
  );

  // Filter records by employee name search
  const filteredRecords = useMemo(() => {
    if (!searchEmp.trim()) return records;
    const q = searchEmp.trim().toLowerCase();
    return records.filter(r => r.employee_name?.toLowerCase().includes(q));
  }, [records, searchEmp]);

  const { recordedIds, unrecorded, totals } = useMemo(() => {
    const recordedIds = new Set(records.map(r => r.employee_id));
    const unrecorded  = employees.filter(e => !recordedIds.has(e.id));
    const totals = {
      net:       records.reduce((s, r) => s + r.net_salary, 0),
      base:      records.reduce((s, r) => s + r.base_salary, 0),
      deduction: records.reduce((s, r) => s + r.absence_deduction, 0),
      extra:     records.reduce((s, r) => s + r.extra_pay, 0),
      friday:    records.reduce((s, r) => s + (r.friday_pay || 0), 0),
      advance:   records.reduce((s, r) => s + (r.cash_advance || 0), 0),
    };
    return { recordedIds, unrecorded, totals };
  }, [records, employees]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, empRes] = await Promise.all([
        axios.get('/api/salary', { params: filterMonth ? { month: filterMonth } : {} }),
        axios.get('/api/employees'),
      ]);
      setRecords(recRes.data);
      setEmployees(empRes.data);
    } catch {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Clamp friday_days when month changes
  useEffect(() => {
    const max = countFridaysInMonth(form.month);
    if (Number(form.friday_days) > max) {
      setForm(f => ({ ...f, friday_days: String(max) }));
    }
  }, [form.month]);

  // Auto-load attendance — NEW RECORDS ONLY
  useEffect(() => {
    if (editItem || !form.employee_id || !form.month) return;
    let cancelled = false;
    const load = async () => {
      setAttLoading(true);
      try {
        const res = await axios.get(`/api/attendance/summary/${form.month}`);
        if (cancelled) return;
        const row = res.data.find(r => String(r.employee_id) === String(form.employee_id));
        if (row && row.total_recorded > 0) {
          setForm(f => ({
            ...f,
            absent_days: String(row.absent_days || 0),
            friday_days: String(row.friday_present_days || 0),
          }));
          setAttSource('attendance');
        } else {
          setAttSource(null);
        }
      } catch {
        if (!cancelled) setAttSource(null);
      } finally {
        if (!cancelled) setAttLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [form.employee_id, form.month, editItem]);

  // Auto-load cash advances — NEW RECORDS ONLY
  useEffect(() => {
    if (editItem || !form.employee_id || !form.month) return;
    let cancelled = false;
    const load = async () => {
      setAdvLoading(true);
      try {
        const res = await axios.get(`/api/cash-advances/totals/${form.month}`);
        if (cancelled) return;
        const row   = res.data.find(r => String(r.employee_id) === String(form.employee_id));
        const total = row ? row.total_advance : 0;
        setAdvTotal(total);
        setForm(f => ({ ...f, cash_advance: String(total) }));
      } catch {
        if (!cancelled) setAdvTotal(0);
      } finally {
        if (!cancelled) setAdvLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [form.employee_id, form.month, editItem]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setAttSource(null);
    setAdvTotal(0);
    setForm({ ...EMPTY_FORM, month: filterMonth || currentMonth() });
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditItem(rec);
    setAttSource(null);
    setAdvTotal(rec.cash_advance || 0);
    setForm({
      employee_id:  String(rec.employee_id),
      month:        rec.month,
      absent_days:  String(rec.absent_days),
      extra_hours:  String(rec.extra_hours),
      friday_days:  String(rec.friday_days ?? 0),
      cash_advance: String(rec.cash_advance ?? 0),
      notes:        rec.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setAttSource(null);
    setAdvTotal(0);
    setForm(EMPTY_FORM);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.month) return toast.error('اختر الموظف والشهر');

    const absent  = Number(form.absent_days) || 0;
    const fridays = Number(form.friday_days) || 0;
    if (absent < 0 || absent > WORK_DAYS)
      return toast.error(`أيام الغياب يجب أن تكون بين 0 و ${WORK_DAYS}`);
    if (fridays < 0 || fridays > totalFridaysInMonth)
      return toast.error(`أيام الجمعة لا يمكن أن تتجاوز ${totalFridaysInMonth}`);

    setSaving(true);
    try {
      const payload = {
        employee_id:  Number(form.employee_id),
        month:        form.month,
        absent_days:  absent,
        extra_hours:  Number(form.extra_hours) || 0,
        friday_days:  fridays,
        cash_advance: Number(form.cash_advance) || 0,
        notes:        form.notes,
      };
      if (editItem) {
        await axios.put(`/api/salary/${editItem.id}`, payload);
        toast.success('تم تعديل السجل بنجاح');
      } else {
        await axios.post('/api/salary', payload);
        toast.success('تم حفظ الراتب بنجاح');
      }
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/salary/${deleteTarget.id}`);
      toast.success('تم حذف السجل');
      setDeleteTarget(null);
      fetchAll();
    } catch {
      toast.error('فشل في الحذف');
    } finally {
      setDeleting(false);
    }
  };

  // ── Bulk add ───────────────────────────────────────────────────────────────
  const openBulkModal = () => {
    setBulkProgress({ done: 0, total: 0, errors: [] });
    setBulkModal(true);
  };

  const handleBulkSave = async () => {
    const month = filterMonth || currentMonth();
    const toAdd = employees.filter(e => !recordedIds.has(e.id));
    if (toAdd.length === 0)
      return toast.error('جميع الموظفين مسجلة رواتبهم بالفعل في هذا الشهر');

    setBulkSaving(true);
    setBulkProgress({ done: 0, total: toAdd.length, errors: [] });

    let attMap = {}, advMap = {};
    try {
      const [attRes, advRes] = await Promise.all([
        axios.get(`/api/attendance/summary/${month}`),
        axios.get(`/api/cash-advances/totals/${month}`),
      ]);
      attRes.data.forEach(r => { attMap[r.employee_id] = r; });
      advRes.data.forEach(r => { advMap[r.employee_id] = r.total_advance || 0; });
    } catch { /* non-fatal */ }

    const maxFridays = countFridaysInMonth(month);
    let done = 0;

    for (const emp of toAdd) {
      const att     = attMap[emp.id];
      const absent  = att ? (att.absent_days || 0) : 0;
      const fridays = att ? Math.min(att.friday_present_days || 0, maxFridays) : 0;
      const advance = advMap[emp.id] || 0;
      try {
        await axios.post('/api/salary', {
          employee_id: emp.id, month,
          absent_days: absent, extra_hours: 0,
          friday_days: fridays, cash_advance: advance, notes: '',
        });
        done++;
        setBulkProgress(p => ({ ...p, done }));
      } catch (err) {
        const msg = err?.response?.data?.message || 'خطأ';
        setBulkProgress(p => ({ ...p, errors: [...p.errors, { name: emp.name, msg }] }));
      }
    }

    setBulkSaving(false);
    if (done === toAdd.length) {
      toast.success(`✅ تم إضافة رواتب ${done} موظف بنجاح`);
      setBulkModal(false);
    } else {
      toast.error(`تم إضافة ${done} من أصل ${toAdd.length}`);
    }
    fetchAll();
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (records.length === 0) return toast.error('لا توجد بيانات لطباعتها');
    const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (!win) return toast.error('الرجاء السماح بفتح نوافذ منبثقة في المتصفح');
    win.document.write(buildPrintHtml({ records, filterMonth }));
    win.document.close();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div className="page-header-el" style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>الرواتب</h1>
          <p style={s.pageSubtitle}>الأجر اليومي × {WORK_DAYS} يوم + أيام الجمعة + الساعات الإضافية − الغياب</p>
        </div>
        <div style={s.headerActions}>
          {records.length > 0 && (
            <button onClick={handlePrint} style={s.printBtn}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              طباعة الكشف
            </button>
          )}
          {canManage && (
            <>
              <button className="add-btn-el" onClick={openAdd} style={s.addBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                إضافة راتب
              </button>
              <button onClick={openBulkModal} style={s.bulkBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                إضافة رواتب الكل
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter + Search bar */}
      <div style={s.filterRow}>
        {/* Month filter */}
        <div style={s.filterLabel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC1010" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          تصفية بالشهر:
        </div>
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          style={s.monthInput}
        />
        {filterMonth && (
          <button onClick={() => setFilterMonth('')} style={s.clearFilterBtn}>عرض الكل</button>
        )}
        {filterMonth && (
          <span style={s.fridayInfoBadge}>
            🗓️ الجُمَع في {formatMonth(filterMonth)}: <strong>{countFridaysInMonth(filterMonth)}</strong>
          </span>
        )}

        {/* Employee search */}
        <div style={s.searchWrap}>
          <svg style={s.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="بحث باسم الموظف..."
            value={searchEmp}
            onChange={e => setSearchEmp(e.target.value)}
            style={s.searchInput}
          />
          {searchEmp && (
            <button onClick={() => setSearchEmp('')} style={s.searchClearBtn} aria-label="مسح البحث">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Search results count */}
        {searchEmp.trim() && (
          <span style={s.searchResultBadge}>
            {filteredRecords.length === 0
              ? 'لا نتائج'
              : `${filteredRecords.length} نتيجة`}
          </span>
        )}
      </div>

      {/* Summary cards — always based on all records (not filtered) */}
      {records.length > 0 && (
        <div className="stats-row-el" style={s.statsRow}>
          <SummaryCard label="الرواتب الأساسية"      value={totals.base}      color="#1A6EB0" icon="📋" />
          <SummaryCard label="أجر أيام الجمعة"       value={totals.friday}    color="#7B2FBE" icon="🗓️" />
          <SummaryCard label="خصم الغياب"             value={totals.deduction} color="#CC1010" icon="📉" minus />
          <SummaryCard label="السُّلَف المخصومة"       value={totals.advance}   color="#B45309" icon="💸" minus />
          <SummaryCard label="الساعات الإضافية"       value={totals.extra}     color="#0A7A4E" icon="⏱️" />
          <SummaryCard label="إجمالي الصافي المستحق" value={totals.net}       color="#CC1010" icon="💵" highlight />
        </div>
      )}

      {/* Unrecorded employees alert */}
      {filterMonth && unrecorded.length > 0 && canManage && (
        <div style={s.alertBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            <strong>{unrecorded.length}</strong> موظف لم يُسجَّل راتبهم في {formatMonth(filterMonth)}:{' '}
            {unrecorded.slice(0, 4).map(e => e.name).join('، ')}
            {unrecorded.length > 4 ? ' وآخرون...' : ''}
          </span>
        </div>
      )}

      {/* Records table */}
      <div className="table-wrap-el" style={s.tableWrap}>
        {loading ? (
          <LoadingSpinner />
        ) : records.length === 0 ? (
          <div style={s.centered}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>💰</div>
            <p style={{ color: '#999', fontSize: 15, marginBottom: 16 }}>
              {filterMonth ? `لا توجد رواتب في ${formatMonth(filterMonth)}` : 'لا توجد سجلات رواتب بعد'}
            </p>
            {canManage && <button onClick={openAdd} style={s.addBtn}>إضافة أول راتب</button>}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={s.centered}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ color: '#999', fontSize: 15 }}>
              لا يوجد موظف باسم "<strong>{searchEmp}</strong>"
            </p>
            <button onClick={() => setSearchEmp('')} style={{ ...s.clearFilterBtn, marginTop: 14 }}>
              مسح البحث
            </button>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['#', 'الموظف', 'الشهر', 'الأجر اليومي', 'الراتب الأساسي', 'أيام جمعة', 'أجر الجمعة', 'غياب', 'خصم', 'إضافي', 'أجر إضافي', 'سلفة', 'صافي الراتب', canManage ? 'إجراءات' : null]
                  .filter(Boolean)
                  .map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec, idx) => (
                <RecordRow
                  key={rec.id}
                  rec={rec}
                  idx={idx}
                  canManage={canManage}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  searchEmp={searchEmp}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Single record modal */}
      {showModal && (
        <Modal title={editItem ? 'تعديل سجل الراتب' : 'إضافة راتب موظف'} onClose={closeModal}>
          <SalaryForm
            form={form}
            setForm={setForm}
            editItem={editItem}
            employees={employees}
            saving={saving}
            attLoading={attLoading}
            attSource={attSource}
            setAttSource={setAttSource}
            advLoading={advLoading}
            advTotal={advTotal}
            totalFridaysInMonth={totalFridaysInMonth}
            selectedEmp={selectedEmp}
            preview={preview}
            onSubmit={handleSave}
            onClose={closeModal}
          />
        </Modal>
      )}

      {/* Bulk modal */}
      {bulkModal && (
        <Modal
          title="إضافة رواتب جميع الموظفين"
          onClose={() => { if (!bulkSaving) setBulkModal(false); }}
          small
        >
          <BulkModal
            saving={bulkSaving}
            progress={bulkProgress}
            unrecordedCount={unrecorded.length}
            month={filterMonth || currentMonth()}
            onConfirm={handleBulkSave}
            onClose={() => setBulkModal(false)}
          />
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <Modal title="حذف سجل الراتب" onClose={() => setDeleteTarget(null)} small>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#4A4A4A', fontSize: 15, marginBottom: 6 }}>هل تريد حذف راتب</p>
            <p style={{ color: '#CC1010', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{deleteTarget.employee_name}</p>
            <p style={{ color: '#999', fontSize: 14 }}>عن شهر {formatMonth(deleteTarget.month)}</p>
          </div>
          <div style={s.modalFooter}>
            <button onClick={() => setDeleteTarget(null)} style={s.cancelBtn}>إلغاء</button>
            <button onClick={handleDelete} disabled={deleting} style={{ ...s.submitBtn, background: '#CC1010' }}>
              {deleting ? 'جارٍ الحذف...' : 'نعم، احذف'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        input:focus, select:focus { outline:none; border-color:#CC1010!important; box-shadow:0 0 0 3px rgba(204,16,16,0.1)!important; }
        tr:hover td { background:#FAFAFA; }
        .search-highlight { background:#FFF3CD; border-radius:3px; padding:0 2px; }
      `}</style>
    </div>
  );
}

// ─── Highlight matching text in employee name ─────────────────────────────────

function HighlightText({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Extracted sub-components ─────────────────────────────────────────────────

function RecordRow({ rec, idx, canManage, onEdit, onDelete, searchEmp }) {
  return (
    <tr style={s.tr}>
      <td style={{ ...s.td, ...s.tdNum }}>{idx + 1}</td>
      <td style={s.td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...s.empAvatar, background: rec.gender === 'female' ? '#FFF0F6' : '#EBF5FF' }}>
            {rec.gender === 'male' ? '👨' : '👩'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              <HighlightText text={rec.employee_name} query={searchEmp || ''} />
            </div>
            {rec.department && <div style={{ fontSize: 11, color: '#B0B0B0' }}>{rec.department}</div>}
          </div>
        </div>
      </td>
      <td style={{ ...s.td, fontWeight: 600, color: '#555' }}>{formatMonth(rec.month)}</td>
      <td style={{ ...s.td, color: '#1A6EB0', fontWeight: 600 }}>
        {fmt(rec.daily_wage)}<span style={{ fontSize: 11, color: '#B0B0B0', fontWeight: 400 }}> ج.م</span>
      </td>
      <td style={{ ...s.td, color: '#555' }}>
        {fmt(rec.base_salary)}<span style={{ fontSize: 11, color: '#B0B0B0', fontWeight: 400 }}> ج.م</span>
      </td>
      <td style={s.td}>
        {(rec.friday_days || 0) > 0
          ? <span style={{ ...s.badge, background: '#F3E8FF', color: '#7B2FBE' }}>{rec.friday_days} يوم</span>
          : <span style={{ color: '#C0C0C0', fontSize: 13 }}>—</span>}
      </td>
      <td style={{ ...s.td, color: (rec.friday_pay || 0) > 0 ? '#7B2FBE' : '#C0C0C0', fontWeight: 600 }}>
        {(rec.friday_pay || 0) > 0 ? `+ ${fmt(rec.friday_pay)} ج.م` : '—'}
      </td>
      <td style={s.td}>
        {rec.absent_days > 0
          ? <span style={{ ...s.badge, background: '#FFF5F5', color: '#CC1010' }}>{rec.absent_days} يوم</span>
          : <span style={{ ...s.badge, background: '#E8F8F0', color: '#0A7A4E' }}>لا غياب</span>}
      </td>
      <td style={{ ...s.td, color: rec.absence_deduction > 0 ? '#CC1010' : '#C0C0C0', fontWeight: 600 }}>
        {rec.absence_deduction > 0 ? `- ${fmt(rec.absence_deduction)} ج.م` : '—'}
      </td>
      <td style={s.td}>
        {rec.extra_hours > 0
          ? <span style={{ ...s.badge, background: '#F0FFF4', color: '#0A7A4E' }}>{rec.extra_hours} ساعة</span>
          : <span style={{ color: '#C0C0C0', fontSize: 13 }}>—</span>}
      </td>
      <td style={{ ...s.td, color: rec.extra_pay > 0 ? '#0A7A4E' : '#C0C0C0', fontWeight: 600 }}>
        {rec.extra_pay > 0 ? `+ ${fmt(rec.extra_pay)} ج.م` : '—'}
      </td>
      <td style={s.td}>
        {(rec.cash_advance || 0) > 0
          ? <span style={{ ...s.badge, background: '#FFF8EC', color: '#B45309', fontWeight: 700 }}>- {fmt(rec.cash_advance)} ج.م</span>
          : <span style={{ color: '#C0C0C0', fontSize: 13 }}>—</span>}
      </td>
      <td style={s.td}>
        <span style={s.netBadge}>{fmt(rec.net_salary)} ج.م</span>
      </td>
      {canManage && (
        <td style={s.td}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onEdit(rec)} style={s.editBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              تعديل
            </button>
            <button onClick={() => onDelete(rec)} style={s.deleteBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              حذف
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

function SalaryForm({
  form, setForm, editItem, employees, saving,
  attLoading, attSource, setAttSource,
  advLoading, advTotal,
  totalFridaysInMonth, selectedEmp, preview,
  onSubmit, onClose,
}) {
  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid-el" style={s.formGrid}>
        <Field label="الموظف *">
          <select value={form.employee_id} onChange={setField('employee_id')} style={s.input} required disabled={!!editItem}>
            <option value="">اختر الموظف</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} — {fmt(e.daily_wage)} ج.م/يوم</option>
            ))}
          </select>
        </Field>

        <Field label="الشهر *">
          <input type="month" value={form.month} onChange={setField('month')} style={s.input} required disabled={!!editItem} />
        </Field>

        <Field label={`أيام الغياب (من أصل ${WORK_DAYS})`}>
          <div style={{ position: 'relative' }}>
            <input
              type="number" min="0" max={WORK_DAYS}
              value={form.absent_days}
              onChange={e => { setForm(f => ({ ...f, absent_days: e.target.value })); setAttSource('manual'); }}
              style={s.input}
            />
            {attLoading && <AutoLoadBadge text="جارٍ تحميل سجل الحضور..." />}
            {attSource === 'attendance' && !attLoading && (
              <div style={s.attBadge}>
                ✓ محمّل تلقائياً من سجل الحضور (غياب + أيام الجمعة)
                <button type="button" onClick={() => { setForm(f => ({ ...f, absent_days: '0', friday_days: '0' })); setAttSource('manual'); }} style={s.attResetBtn}>
                  مسح
                </button>
              </div>
            )}
          </div>
        </Field>

        <Field label={`ساعات إضافية (${EXTRA_HOUR_RATE} ج.م/ساعة)`}>
          <input type="number" min="0" value={form.extra_hours} onChange={setField('extra_hours')} style={s.input} />
        </Field>
      </div>

      {/* Cash advance section */}
      <div style={s.advanceSection}>
        <div style={s.sectionHeader}>
          <div style={{ ...s.sectionIcon, background: '#FFF8EC' }}>💸</div>
          <div>
            <div style={s.sectionTitle}>السُّلفة النقدية المخصومة</div>
            <div style={s.sectionSub}>تُخصم من صافي الراتب النهائي</div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <input type="number" min="0" step="0.01" value={form.cash_advance} onChange={setField('cash_advance')} placeholder="0" style={s.input} />
          {advLoading && <AutoLoadBadge text="جارٍ تحميل سجل السلف..." />}
          {!advLoading && advTotal > 0 && (
            <div style={{ ...s.attBadge, background: '#FFF8EC', border: '1px solid #FCD38D', color: '#B45309' }}>
              {editItem
                ? `✓ السلفة المحفوظة: ${fmt(advTotal)} ج.م`
                : `✓ تم تحميلها تلقائياً من سجل السلف (${fmt(advTotal)} ج.م)`}
              <button type="button" onClick={() => setForm(f => ({ ...f, cash_advance: '0' }))} style={s.attResetBtn}>مسح</button>
            </div>
          )}
          {!advLoading && advTotal === 0 && form.employee_id && form.month && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#999' }}>لا توجد سلف مسجلة لهذا الموظف في هذا الشهر — يمكنك إدخالها يدوياً</div>
          )}
        </div>
      </div>

      {/* Friday days section */}
      <div style={s.fridaySection}>
        <div style={s.sectionHeader}>
          <div style={{ ...s.sectionIcon, background: '#F3E8FF' }}>🗓️</div>
          <div>
            <div style={s.sectionTitle}>أيام الجمعة المعمولة</div>
            <div style={s.sectionSub}>
              {form.month
                ? `شهر ${formatMonth(form.month)} يحتوي على ${totalFridaysInMonth} ${totalFridaysInMonth === 1 ? 'جمعة' : 'جُمَع'}`
                : 'اختر الشهر أولاً'}
            </div>
          </div>
        </div>
        {form.month && (
          <div style={s.fridayPicker}>
            {Array.from({ length: totalFridaysInMonth + 1 }, (_, i) => {
              const selected = Number(form.friday_days) === i;
              return (
                <button
                  key={i} type="button"
                  onClick={() => setForm(f => ({ ...f, friday_days: String(i) }))}
                  style={{ ...s.fridayBtn, ...(selected ? s.fridayBtnActive : {}) }}
                >
                  {i === 0 ? 'لا جمعة' : `${i} ${i === 1 ? 'جمعة' : 'جُمَع'}`}
                </button>
              );
            })}
          </div>
        )}
        {Number(form.friday_days) > 0 && selectedEmp && (
          <div style={s.fridayCalcNote}>
            {Number(form.friday_days)} يوم × {fmt(selectedEmp.daily_wage)} ج.م ={' '}
            <strong style={{ color: '#7B2FBE' }}>{fmt(Number(form.friday_days) * Number(selectedEmp.daily_wage))} ج.م</strong> إضافية
          </div>
        )}
      </div>

      <Field label="ملاحظات">
        <input value={form.notes} onChange={setField('notes')} placeholder="ملاحظات اختيارية" style={{ ...s.input, marginBottom: 20 }} />
      </Field>

      {/* Salary preview */}
      {preview && (
        <div style={s.previewBox}>
          <div style={s.previewTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC1010" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            معاينة الراتب
          </div>
          <div style={s.previewGrid}>
            <PreviewRow label={`الراتب الأساسي (${WORK_DAYS} يوم × ${fmt(selectedEmp?.daily_wage)} ج.م)`} value={`${fmt(preview.base_salary)} ج.م`} />
            {preview.friday_pay > 0 && <PreviewRow label={`أجر الجمعة (${form.friday_days} يوم × ${fmt(selectedEmp?.daily_wage)} ج.م)`} value={`+ ${fmt(preview.friday_pay)} ج.م`} color="#7B2FBE" />}
            {preview.absence_deduction > 0 && <PreviewRow label={`خصم الغياب (${form.absent_days} يوم × ${fmt(selectedEmp?.daily_wage)} ج.م)`} value={`- ${fmt(preview.absence_deduction)} ج.م`} color="#CC1010" />}
            {preview.extra_pay > 0 && <PreviewRow label={`أجر إضافي (${form.extra_hours} ساعة × ${EXTRA_HOUR_RATE} ج.م)`} value={`+ ${fmt(preview.extra_pay)} ج.م`} color="#0A7A4E" />}
            {preview.cash_advance > 0 && <PreviewRow label="خصم السُّلفة النقدية" value={`- ${fmt(preview.cash_advance)} ج.م`} color="#CC1010" />}
            <PreviewRow label="إجمالي أيام العمل الفعلية" value={`${preview.actual_days} يوم (${WORK_DAYS} + ${Number(form.friday_days) || 0} جمعة − ${Number(form.absent_days) || 0} غياب)`} />
            <div style={s.previewNetRow}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>صافي الراتب</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#CC1010' }}>{fmt(preview.net_salary)} ج.م</span>
            </div>
          </div>
        </div>
      )}

      <div style={s.modalFooter}>
        <button type="button" onClick={onClose} style={s.cancelBtn}>إلغاء</button>
        <button type="submit" disabled={saving} style={s.submitBtn}>
          {saving ? 'جارٍ الحفظ...' : editItem ? 'حفظ التعديلات' : 'حفظ الراتب'}
        </button>
      </div>
    </form>
  );
}

function BulkModal({ saving, progress, unrecordedCount, month, onConfirm, onClose }) {
  const isIdle = !saving && progress.done === 0 && progress.errors.length === 0;
  const pct    = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  if (isIdle) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <p style={{ color: '#4A4A4A', fontSize: 15, marginBottom: 8 }}>
            سيتم إضافة رواتب شهر <strong style={{ color: '#CC1010' }}>{formatMonth(month)}</strong>
          </p>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 6 }}>
            لـ <strong>{unrecordedCount}</strong> موظف لم يُسجَّل راتبهم بعد
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>يتم تحميل الغياب وأيام الجمعة والسلف تلقائياً من سجلاتهم</p>
        </div>
        <div style={s.modalFooter}>
          <button onClick={onClose} style={s.cancelBtn}>إلغاء</button>
          <button onClick={onConfirm} style={s.submitBtn}>✅ نعم، أضف رواتب الكل</button>
        </div>
      </>
    );
  }

  return (
    <div style={{ padding: '8px 0 16px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>
            {saving ? 'جاري إضافة الرواتب...' : 'اكتملت العملية'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#CC1010' }}>{progress.done} / {progress.total}</span>
        </div>
        <div style={{ height: 10, background: '#F0F0F0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: '#0A7A4E', transition: 'width 0.3s', width: `${pct}%` }} />
        </div>
      </div>
      {progress.errors.length > 0 && (
        <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {progress.errors.map((e, i) => (
            <div key={i} style={{ padding: '7px 12px', background: '#FFF5F5', borderRadius: 8, fontSize: 13, color: '#CC1010' }}>
              ⚠️ <strong>{e.name}</strong>: {e.msg}
            </div>
          ))}
        </div>
      )}
      {!saving && (
        <div style={{ ...s.modalFooter, marginTop: 16 }}>
          <button onClick={onClose} style={s.cancelBtn}>إغلاق</button>
        </div>
      )}
    </div>
  );
}

function AutoLoadBadge({ text }) {
  return (
    <div style={s.attLoadingBadge}>
      <span style={s.spinnerInline} />
      {text}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  // Layout
  pageHeader:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 },
  pageTitle:     { fontSize: 26, fontWeight: 800, color: '#1A1A1A', margin: 0 },
  pageSubtitle:  { fontSize: 15, color: '#999', marginTop: 4, fontWeight: 500 },
  headerActions: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },

  // Buttons
  addBtn:   { display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: '#CC1010', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(204,16,16,0.25)', flexShrink: 0 },
  bulkBtn:  { display: 'flex', alignItems: 'center', gap: 8, padding: '13px 22px', background: '#0A7A4E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,122,78,0.25)', flexShrink: 0 },
  printBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '13px 22px', background: '#fff', color: '#1A6EB0', border: '1.5px solid #1A6EB0', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  editBtn:  { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#F0F7FF', color: '#1A6EB0', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  deleteBtn:{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FFF5F5', color: '#CC1010', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  cancelBtn:{ padding: '12px 26px', border: '1.5px solid #E0E0E0', borderRadius: 9, background: '#fff', color: '#4A4A4A', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  submitBtn:{ padding: '12px 30px', border: 'none', borderRadius: 9, background: '#CC1010', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(204,16,16,0.2)' },

  // Filter bar
  filterRow:       { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' },
  filterLabel:     { display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: '#555' },
  monthInput:      { padding: '10px 16px', fontSize: 15, fontFamily: 'Cairo,sans-serif', border: '1.5px solid #E8E8E8', borderRadius: 9, background: '#fff', color: '#1A1A1A', direction: 'ltr' },
  clearFilterBtn:  { padding: '10px 20px', border: '1.5px solid #E8E8E8', borderRadius: 9, background: '#fff', color: '#767676', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  fridayInfoBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 16px', background: '#F3E8FF', color: '#7B2FBE', borderRadius: 20, fontSize: 14, fontWeight: 600 },

  // Search
  searchWrap:        { position: 'relative', display: 'flex', alignItems: 'center', minWidth: 220 },
  searchIcon:        { position: 'absolute', right: 13, pointerEvents: 'none', flexShrink: 0 },
  searchInput:       { width: '100%', padding: '10px 38px 10px 36px', fontSize: 14, fontFamily: 'Cairo,sans-serif', border: '1.5px solid #E8E8E8', borderRadius: 9, background: '#fff', color: '#1A1A1A', direction: 'rtl', transition: 'border-color 0.2s, box-shadow 0.2s' },
  searchClearBtn:    { position: 'absolute', left: 10, background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 },
  searchResultBadge: { display: 'inline-flex', alignItems: 'center', padding: '6px 14px', background: '#F0F7FF', color: '#1A6EB0', borderRadius: 20, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },

  // Cards
  statsRow:             { display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' },
  summaryCard:          { background: '#fff', border: '1px solid #EBEBEB', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  summaryCardHighlight: { background: '#1A1A1A', border: '1px solid #1A1A1A' },
  summaryIcon:          { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 },

  // Alert
  alertBox: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, marginBottom: 20, fontSize: 14, color: '#92400E', lineHeight: 1.6 },

  // Table
  tableWrap: { background: '#fff', borderRadius: 14, border: '1px solid #EBEBEB', overflow: 'auto' },
  centered:  { textAlign: 'center', padding: '64px 20px' },
  spinner:   { width: 38, height: 38, border: '3px solid #F0F0F0', borderTopColor: '#CC1010', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
  table:     { width: '100%', borderCollapse: 'collapse', minWidth: 1100 },
  th:        { padding: '15px 18px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#B0B0B0', background: '#FAFAFA', borderBottom: '1px solid #EBEBEB', whiteSpace: 'nowrap' },
  tr:        { transition: 'background 0.15s' },
  td:        { padding: '15px 18px', fontSize: 15, color: '#2D2D2D', borderBottom: '1px solid #F5F5F5', verticalAlign: 'middle' },
  tdNum:     { color: '#C0C0C0', fontSize: 13, width: 40, textAlign: 'center' },
  empAvatar: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 },
  badge:     { display: 'inline-flex', padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600 },
  netBadge:  { display: 'inline-flex', padding: '6px 16px', borderRadius: 99, fontSize: 14, fontWeight: 800, background: 'rgba(204,16,16,0.08)', color: '#CC1010' },

  // Modal
  modalOverlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox:      { background: '#fff', borderRadius: 18, width: '100%', maxHeight: '92vh', overflowY: 'auto', animation: 'fadeIn 0.25s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 30px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
  modalTitle:    { fontSize: 19, fontWeight: 800, color: '#1A1A1A', margin: 0 },
  modalCloseBtn: { background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', padding: 4 },
  modalBody:     { padding: '26px 30px 30px' },
  modalFooter:   { display: 'flex', gap: 10, justifyContent: 'flex-end' },

  // Form
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 22px', marginBottom: 22 },
  field:     { display: 'flex', flexDirection: 'column', gap: 7 },
  fieldLabel:{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' },
  input:     { padding: '12px 16px', fontSize: 15, fontFamily: 'Cairo,sans-serif', border: '1.5px solid #E8E8E8', borderRadius: 9, background: '#FAFAFA', color: '#1A1A1A', direction: 'rtl', width: '100%', transition: 'all 0.2s' },

  // Auto-load badges
  attLoadingBadge: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13, color: '#B45309' },
  spinnerInline:   { width: 12, height: 12, border: '2px solid #E0E0E0', borderTopColor: '#B45309', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
  attBadge:        { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 13, color: '#0A7A4E', background: '#E8F8F0', padding: '6px 12px', borderRadius: 6, border: '1px solid #B8EAD4' },
  attResetBtn:     { background: 'none', border: 'none', color: '#CC1010', fontSize: 12, cursor: 'pointer', padding: '0 0 0 4px', fontFamily: 'Cairo,sans-serif' },

  // Section blocks
  advanceSection: { border: '1.5px solid #FCD38D', borderRadius: 12, background: '#FFFDF5', padding: '18px 22px', marginBottom: 22 },
  fridaySection:  { border: '1.5px solid #E8D5FF', borderRadius: 12, background: '#FAFAFE', padding: '18px 22px', marginBottom: 22 },
  sectionHeader:  { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 },
  sectionIcon:    { width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  sectionTitle:   { fontSize: 15, fontWeight: 700, color: '#1A1A1A' },
  sectionSub:     { fontSize: 13, color: '#999', marginTop: 2 },

  // Friday picker
  fridayPicker:    { display: 'flex', flexWrap: 'wrap', gap: 9 },
  fridayBtn:       { padding: '9px 18px', borderRadius: 20, border: '1.5px solid #E0D0F0', background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' },
  fridayBtnActive: { background: '#7B2FBE', color: '#fff', borderColor: '#7B2FBE', boxShadow: '0 3px 10px rgba(123,47,190,0.3)' },
  fridayCalcNote:  { marginTop: 13, fontSize: 14, color: '#555', background: '#fff', padding: '9px 16px', borderRadius: 8, border: '1px solid #E8D5FF' },

  // Preview
  previewBox:    { background: '#FAFAFA', border: '1.5px solid #EBEBEB', borderRadius: 12, padding: '18px 22px', marginBottom: 22 },
  previewTitle:  { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#CC1010', marginBottom: 14 },
  previewGrid:   { display: 'flex', flexDirection: 'column', gap: 0 },
  previewRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F0F0' },
  previewNetRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0 2px', marginTop: 9, borderTop: '2px solid #E0E0E0' },
};
