import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { NoAccess } from './NoAccess';

// ── Helpers ──────────────────────────────────────────────────────────────────

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                   'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const AR_DAYS   = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatMonth(m) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return `${AR_MONTHS[parseInt(mo,10)-1]} ${y}`;
}

function formatDateAr(dateStr) {
  if (!dateStr) return '';
  const d  = new Date(dateStr + 'T00:00:00');
  const day = AR_DAYS[d.getDay()];
  return `${day} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
}

// Get all working days (Sat–Fri, including Fri) in a YYYY-MM
function getWorkDaysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const days = [];
  const total = new Date(year, month, 0).getDate();
  for (let d = 1; d <= total; d++) {
    const date    = new Date(year, month-1, d);
    const dayOfWk = date.getDay(); // 0=Sun … 6=Sat, 5=Fri
    const str = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    days.push({ date: str, dayOfWeek: dayOfWk, dayNum: d, isFriday: dayOfWk === 5 });
  }
  return days;
}

// Status config
const STATUS = {
  present: { label: 'حاضر',  color: '#0A7A4E', bg: '#E8F8F0', icon: '✓' },
  absent:  { label: 'غائب',  color: '#CC1010', bg: '#FFF5F5', icon: '✗' },
  leave:   { label: 'إجازة', color: '#B45309', bg: '#FFFBEB', icon: '◎' },
};

// ── Main component ────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { hasPermission, hasAnyPermission } = useAuth();

  if (!hasAnyPermission('view_attendance', 'manage_attendance')) {
    return <NoAccess page="الحضور والغياب" />;
  }
  const canManage = hasPermission('manage_attendance');

  // ── State ──────────────────────────────────────────────────────────────
  const [month,      setMonth]      = useState(currentMonth());
  const [employees,  setEmployees]  = useState([]);
  const [attendance, setAttendance] = useState({}); // { 'empId-date': status }
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [dirty,      setDirty]      = useState({}); // cells changed but not saved
  const [selectedDay, setSelectedDay] = useState(todayStr()); // for day view

  // View mode: 'month' = full matrix, 'day' = one day for all employees
  const [viewMode, setViewMode] = useState('day');

  const workDays = getWorkDaysInMonth(month);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/attendance', { params: { month } }),
      ]);
      setEmployees(empRes.data);

      // Convert array to lookup map { 'empId-date': status }
      const map = {};
      for (const row of attRes.data) {
        map[`${row.employee_id}-${row.date}`] = row.status;
      }
      setAttendance(map);
      setDirty({});
    } catch {
      toast.error('فشل في تحميل بيانات الحضور');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Keep selectedDay in sync with month
  useEffect(() => {
    if (!selectedDay.startsWith(month)) {
      setSelectedDay(month + '-01');
    }
  }, [month]);

  // ── Cell state ─────────────────────────────────────────────────────────
  const getStatus = (empId, date) =>
    dirty[`${empId}-${date}`] ?? attendance[`${empId}-${date}`] ?? null;

  const cycleStatus = (empId, date) => {
    if (!canManage) return;
    const current = getStatus(empId, date);
    const next = current === null ? 'present'
               : current === 'present' ? 'absent'
               : current === 'absent'  ? 'leave'
               : null;
    setDirty(d => {
      const key = `${empId}-${date}`;
      if (next === null) {
        const { [key]: _, ...rest } = d;
        // if it was previously saved, mark for deletion with special value
        if (attendance[key]) return { ...rest, [key]: '__delete__' };
        return rest;
      }
      return { ...d, [key]: next };
    });
  };

  const setStatusDirect = (empId, date, status) => {
    if (!canManage) return;
    setDirty(d => ({ ...d, [`${empId}-${date}`]: status }));
  };

  const hasUnsaved = Object.keys(dirty).length > 0;

  // ── Mark all for a day ─────────────────────────────────────────────────
  const markAllDay = (date, status) => {
    if (!canManage) return;
    const updates = {};
    for (const emp of employees) {
      updates[`${emp.id}-${date}`] = status;
    }
    setDirty(d => ({ ...d, ...updates }));
  };

  // ── Save dirty cells ───────────────────────────────────────────────────
  const saveAll = async () => {
    if (!hasUnsaved) return;
    setSaving(true);
    try {
      // Group by date for bulk API calls
      const byDate = {};
      for (const [key, status] of Object.entries(dirty)) {
        const [empId, ...dateParts] = key.split('-');
        const date = dateParts.join('-');
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push({ employee_id: Number(empId), status });
      }

      // Send bulk request per date
      const promises = Object.entries(byDate).map(([date, records]) =>
        axios.post('/api/attendance/bulk', {
          date,
          records: records.filter(r => r.status !== '__delete__'),
        })
      );
      await Promise.all(promises);
      toast.success('تم حفظ سجلات الحضور بنجاح');
      await fetchData();
    } catch {
      toast.error('فشل في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setDirty({});
    toast('تم تجاهل التغييرات');
  };

  // ── Summary stats ──────────────────────────────────────────────────────
  const summary = employees.map(emp => {
    let present = 0, absent = 0, leave = 0, unrecorded = 0;
    for (const wd of workDays) {
      const s = getStatus(emp.id, wd.date);
      if      (s === 'present') present++;
      else if (s === 'absent')  absent++;
      else if (s === 'leave')   leave++;
      else                      unrecorded++;
    }
    return { ...emp, present, absent, leave, unrecorded };
  });

  const totalAbsent    = summary.reduce((s,e) => s+e.absent, 0);
  const totalPresent   = summary.reduce((s,e) => s+e.present, 0);
  const totalLeave     = summary.reduce((s,e) => s+e.leave, 0);
  const totalUnrec     = summary.reduce((s,e) => s+e.unrecorded, 0);

  // Days in selected day view
  const dayEmployees = employees.map(emp => ({
    ...emp,
    status: getStatus(emp.id, selectedDay),
  }));

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>

      {/* ── Header ── */}
      <div className="page-header-el" style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>الحضور والغياب</h1>
          <p style={s.pageSubtitle}>
            تسجيل ومتابعة حضور الموظفين — {formatMonth(month)}
          </p>
        </div>
        {canManage && hasUnsaved && (
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={discardChanges} style={s.discardBtn}>تجاهل التغييرات</button>
            <button onClick={saveAll} disabled={saving} style={s.saveBtn}>
              {saving
                ? <span style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={s.spinnerSmall}/>جارٍ الحفظ...
                  </span>
                : `💾 حفظ (${Object.keys(dirty).length} تعديل)`}
            </button>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div style={s.controls}>
        {/* Month picker */}
        <div style={s.controlGroup}>
          <label style={s.controlLabel}>الشهر</label>
          <input
            type="month" value={month}
            onChange={e => setMonth(e.target.value)}
            style={s.monthInput}
          />
        </div>

        {/* View toggle */}
        <div style={s.viewToggle}>
          <button
            onClick={() => setViewMode('day')}
            style={{ ...s.toggleBtn, ...(viewMode==='day' ? s.toggleBtnActive : {}) }}
          >
            📅 عرض يومي
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={{ ...s.toggleBtn, ...(viewMode==='month' ? s.toggleBtnActive : {}) }}
          >
            🗓️ عرض شهري
          </button>
        </div>

        {/* Unsaved indicator */}
        {hasUnsaved && (
          <div style={s.unsavedBadge}>
            ⚠️ {Object.keys(dirty).length} تعديل غير محفوظ
          </div>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="stats-row-el" style={s.statsRow}>
        <SummaryCard icon="✓" label="إجمالي أيام الحضور"   value={totalPresent} color="#0A7A4E" />
        <SummaryCard icon="✗" label="إجمالي أيام الغياب"   value={totalAbsent}  color="#CC1010" />
        <SummaryCard icon="◎" label="إجمالي أيام الإجازة"  value={totalLeave}   color="#B45309" />
        <SummaryCard icon="?"  label="أيام غير مسجلة"      value={totalUnrec}   color="#B0B0B0" />
      </div>

      {loading ? (
        <div style={s.centered}><div style={s.spinner}/><p style={{color:'#999',marginTop:14}}>جارٍ التحميل...</p></div>
      ) : employees.length === 0 ? (
        <div style={s.centered}>
          <div style={{fontSize:52,marginBottom:12}}>👥</div>
          <p style={{color:'#999',fontSize:15}}>لا يوجد موظفون مسجلون</p>
        </div>
      ) : viewMode === 'day' ? (
        /* ══════════════════════════════════════════════
           DAY VIEW — pick one day, mark all employees
           ══════════════════════════════════════════════ */
        <div>
          {/* Day selector */}
          <div style={s.daySelector}>
            <button
              onClick={() => {
                const idx = workDays.findIndex(d => d.date === selectedDay);
                if (idx > 0) setSelectedDay(workDays[idx-1].date);
              }}
              disabled={workDays[0]?.date === selectedDay}
              style={s.dayNavBtn}
            >
              ▶
            </button>

            <div style={s.dayPickerWrap}>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                style={s.daySelect}
              >
                {workDays.map(wd => (
                  <option key={wd.date} value={wd.date}>
                    {formatDateAr(wd.date)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const idx = workDays.findIndex(d => d.date === selectedDay);
                if (idx < workDays.length-1) setSelectedDay(workDays[idx+1].date);
              }}
              disabled={workDays[workDays.length-1]?.date === selectedDay}
              style={s.dayNavBtn}
            >
              ◀
            </button>

            {/* Quick mark all */}
            {canManage && (
              <div style={s.markAllRow}>
                <span style={{fontSize:13,color:'#666',fontWeight:600}}>تحديد الكل:</span>
                {Object.entries(STATUS).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => markAllDay(selectedDay, k)}
                    style={{ ...s.markAllBtn, background:v.bg, color:v.color, border:`1.5px solid ${v.color}40` }}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Employee list for the day */}
          <div style={s.dayCard}>
            <div style={s.dayCardHeader}>
              <span style={s.dayCardTitle}>{formatDateAr(selectedDay)}</span>
              <span style={s.dayCardSub}>
                {dayEmployees.filter(e=>e.status==='present').length} حاضر ·{' '}
                {dayEmployees.filter(e=>e.status==='absent').length} غائب ·{' '}
                {dayEmployees.filter(e=>e.status==='leave').length} إجازة ·{' '}
                {dayEmployees.filter(e=>!e.status).length} غير مسجل
              </span>
            </div>

            <div style={s.empList}>
              {dayEmployees.map(emp => {
                const st  = emp.status;
                const cfg = st ? STATUS[st] : null;
                const isDirty = dirty[`${emp.id}-${selectedDay}`] !== undefined;
                return (
                  <div key={emp.id} style={{ ...s.empRow, ...(isDirty ? s.empRowDirty : {}) }}>
                    {/* Avatar + name */}
                    <div style={s.empInfo}>
                      <div style={{ ...s.empAvatar, background: emp.gender==='female' ? '#FFF0F6' : '#EBF5FF' }}>
                        {emp.gender === 'male' ? '👨' : '👩'}
                      </div>
                      <div>
                        <div style={s.empName}>{emp.name}</div>
                        {emp.department && <div style={s.empDept}>{emp.department}</div>}
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div style={s.statusBtns}>
                      {canManage ? (
                        Object.entries(STATUS).map(([k, v]) => (
                          <button
                            key={k}
                            onClick={() => setStatusDirect(emp.id, selectedDay, k)}
                            style={{
                              ...s.statusBtn,
                              background: st === k ? v.color : '#F5F5F5',
                              color:      st === k ? '#fff'   : '#999',
                              border:     `1.5px solid ${st === k ? v.color : '#E0E0E0'}`,
                            }}
                          >
                            {v.icon} {v.label}
                          </button>
                        ))
                      ) : (
                        cfg ? (
                          <span style={{ ...s.statusBadge, background:cfg.bg, color:cfg.color }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        ) : (
                          <span style={{ color:'#C0C0C0', fontSize:13 }}>غير مسجل</span>
                        )
                      )}
                    </div>

                    {/* Dirty indicator */}
                    {isDirty && <span style={s.dirtyDot}>●</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════
           MONTH VIEW — full matrix grid
           ══════════════════════════════════════════════ */
        <div>
          {/* Legend */}
          <div style={s.legend}>
            {Object.entries(STATUS).map(([k,v]) => (
              <div key={k} style={s.legendItem}>
                <span style={{ ...s.legendDot, background:v.color }}>{v.icon}</span>
                <span style={{fontSize:12,color:'#555'}}>{v.label}</span>
              </div>
            ))}
            <div style={s.legendItem}>
              <span style={{ ...s.legendDot, background:'#E0E0E0', color:'#999' }}>—</span>
              <span style={{fontSize:12,color:'#555'}}>غير مسجل</span>
            </div>
            {canManage && (
              <div style={{marginRight:'auto',fontSize:12,color:'#999'}}>
                💡 انقر على الخلية للتبديل بين الحالات
              </div>
            )}
          </div>

          {/* Matrix table */}
          <div style={s.matrixWrap}>
            <table style={s.matrix}>
              <thead>
                <tr>
                  <th style={{ ...s.mth, ...s.mthFixed }}>الموظف</th>
                  {workDays.map(wd => (
                    <th key={wd.date} style={{
                      ...s.mth,
                      background: wd.isFriday ? '#F3E8FF' : wd.dayOfWeek === 4 ? '#FFFBEB' : '#FAFAFA', // highlight Friday (purple) and Thursday (yellow)
                    }}>
                      <div style={{fontSize:10,color:'#B0B0B0'}}>{AR_DAYS[wd.dayOfWeek]}</div>
                      <div style={{fontSize:13,fontWeight:700}}>{wd.dayNum}</div>
                    </th>
                  ))}
                  <th style={s.mth}>غياب</th>
                  <th style={s.mth}>حضور</th>
                  <th style={s.mth}>إجازة</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ ...s.mtd, ...s.mtdFixed }}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{...s.empAvatar,width:28,height:28,fontSize:13,background:emp.gender==='female'?'#FFF0F6':'#EBF5FF'}}>
                          {emp.gender==='male'?'👨':'👩'}
                        </div>
                        <span style={{fontSize:13,fontWeight:600}}>{emp.name}</span>
                      </div>
                    </td>
                    {workDays.map(wd => {
                      const st  = getStatus(emp.id, wd.date);
                      const cfg = st ? STATUS[st] : null;
                      const isDirty = dirty[`${emp.id}-${wd.date}`] !== undefined;
                      return (
                        <td
                          key={wd.date}
                          onClick={() => canManage && cycleStatus(emp.id, wd.date)}
                          style={{
                            ...s.mtd,
                            background: cfg ? cfg.bg : wd.isFriday ? '#FAF0FF' : '#fff',
                            cursor:     canManage ? 'pointer' : 'default',
                            outline:    isDirty ? '2px solid #CC1010' : 'none',
                            outlineOffset: '-2px',
                          }}
                          title={cfg ? cfg.label : 'غير مسجل'}
                        >
                          {cfg ? (
                            <span style={{color:cfg.color,fontSize:15,fontWeight:700}}>{cfg.icon}</span>
                          ) : (
                            <span style={{color:'#E0E0E0',fontSize:13}}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ ...s.mtd, fontWeight:700, color:'#CC1010' }}>{emp.absent}</td>
                    <td style={{ ...s.mtd, fontWeight:700, color:'#0A7A4E' }}>{emp.present}</td>
                    <td style={{ ...s.mtd, fontWeight:700, color:'#B45309' }}>{emp.leave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Absence summary table ── */}
      {!loading && employees.length > 0 && (
        <div style={{ marginTop:28 }}>
          <h2 style={s.sectionTitle}>ملخص الغياب للشهر — {formatMonth(month)}</h2>
          <p style={s.sectionSub}>هذه القيم يتم استخدامها تلقائياً عند احتساب الراتب</p>
          <div style={s.summaryTable}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#','الموظف','القسم','أيام العمل','حضور','غياب','إجازة','غير مسجل','حالة التسجيل'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map((emp, idx) => {
                  const recorded  = emp.present + emp.absent + emp.leave;
                  const total     = workDays.length;
                  const complete  = recorded === total;
                  const pct       = total > 0 ? Math.round((recorded/total)*100) : 0;
                  return (
                    <tr key={emp.id} style={s.tr}>
                      <td style={{...s.td,...s.tdNum}}>{idx+1}</td>
                      <td style={s.td}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{...s.empAvatar,background:emp.gender==='female'?'#FFF0F6':'#EBF5FF'}}>
                            {emp.gender==='male'?'👨':'👩'}
                          </div>
                          <span style={{fontWeight:600}}>{emp.name}</span>
                        </div>
                      </td>
                      <td style={{...s.td,color:'#767676'}}>{emp.department || '—'}</td>
                      <td style={{...s.td,fontWeight:600}}>{total}</td>
                      <td style={{...s.td,color:'#0A7A4E',fontWeight:700}}>{emp.present}</td>
                      <td style={{...s.td,color:'#CC1010',fontWeight:700}}>{emp.absent}</td>
                      <td style={{...s.td,color:'#B45309',fontWeight:700}}>{emp.leave}</td>
                      <td style={{...s.td,color:'#B0B0B0'}}>{emp.unrecorded}</td>
                      <td style={s.td}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{...s.progressBar}}>
                            <div style={{...s.progressFill, width:`${pct}%`, background: complete ? '#0A7A4E' : pct > 50 ? '#B45309' : '#CC1010'}}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:600,color:complete?'#0A7A4E':'#B45309'}}>{pct}%</span>
                          {complete && <span style={{...s.badge,background:'#E8F8F0',color:'#0A7A4E',fontSize:11}}>مكتمل</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        input:focus, select:focus { outline:none; border-color:#CC1010!important; box-shadow:0 0 0 3px rgba(204,16,16,0.1)!important; }
        tr:hover td { background:#FAFAFA!important; }
      `}</style>
    </div>
  );
}

/* ── Small components ─────────────────────────────────────────── */

function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:14, flex:1, minWidth:0 }}>
      <div style={{ width:42, height:42, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color, flexShrink:0 }}>
        {icon}
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'#1A1A1A', lineHeight:1.2 }}>{value}</div>
        <div style={{ fontSize:11, color:'#999', marginTop:2, fontWeight:500 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────── */
const s = {
  pageHeader:    { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, gap:16, flexWrap:'wrap' },
  pageTitle:     { fontSize:24, fontWeight:800, color:'#1A1A1A', margin:0 },
  pageSubtitle:  { fontSize:13, color:'#999', marginTop:3, fontWeight:500 },

  saveBtn:       { display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#0A7A4E', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(10,122,78,0.25)' },
  discardBtn:    { padding:'10px 18px', background:'#fff', color:'#767676', border:'1.5px solid #E0E0E0', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' },
  spinnerSmall:  { width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' },

  controls:      { display:'flex', alignItems:'center', gap:16, marginBottom:20, flexWrap:'wrap' },
  controlGroup:  { display:'flex', alignItems:'center', gap:8 },
  controlLabel:  { fontSize:13, fontWeight:600, color:'#555' },
  monthInput:    { padding:'9px 14px', fontSize:14, fontFamily:'Cairo,sans-serif', border:'1.5px solid #E8E8E8', borderRadius:9, background:'#fff', color:'#1A1A1A', direction:'ltr' },

  viewToggle:    { display:'flex', background:'#F5F5F5', borderRadius:10, padding:3, gap:3 },
  toggleBtn:     { padding:'7px 16px', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#767676', transition:'all 0.18s' },
  toggleBtnActive: { background:'#fff', color:'#CC1010', boxShadow:'0 1px 4px rgba(0,0,0,0.1)' },

  unsavedBadge:  { padding:'7px 14px', background:'rgba(204,16,16,0.08)', color:'#CC1010', borderRadius:20, fontSize:13, fontWeight:600, border:'1px solid rgba(204,16,16,0.2)' },

  statsRow:      { display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' },
  centered:      { textAlign:'center', padding:'60px 20px' },
  spinner:       { width:36, height:36, border:'3px solid #F0F0F0', borderTopColor:'#CC1010', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' },

  // Day view
  daySelector:   { display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' },
  dayNavBtn:     { padding:'8px 14px', border:'1.5px solid #E0E0E0', borderRadius:9, background:'#fff', color:'#555', fontSize:16, cursor:'pointer', transition:'all 0.18s' },
  dayPickerWrap: { flex:1, maxWidth:280 },
  daySelect:     { width:'100%', padding:'10px 14px', fontSize:14, fontFamily:'Cairo,sans-serif', border:'1.5px solid #E8E8E8', borderRadius:9, background:'#fff', color:'#1A1A1A', direction:'rtl', cursor:'pointer' },
  markAllRow:    { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginRight:8 },
  markAllBtn:    { padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.18s' },

  dayCard:       { background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', overflow:'hidden' },
  dayCardHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#FAFAFA', borderBottom:'1px solid #EBEBEB', flexWrap:'wrap', gap:8 },
  dayCardTitle:  { fontSize:16, fontWeight:800, color:'#1A1A1A' },
  dayCardSub:    { fontSize:13, color:'#999' },

  empList:       { display:'flex', flexDirection:'column' },
  empRow:        { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #F5F5F5', gap:16, transition:'background 0.15s' },
  empRowDirty:   { background:'rgba(204,16,16,0.025)' },
  empInfo:       { display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 },
  empAvatar:     { width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 },
  empName:       { fontWeight:700, fontSize:14, color:'#1A1A1A' },
  empDept:       { fontSize:11, color:'#B0B0B0', marginTop:1 },

  statusBtns:    { display:'flex', gap:6, flexShrink:0 },
  statusBtn:     { padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.18s' },
  statusBadge:   { display:'inline-flex', alignItems:'center', gap:4, padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:600 },
  dirtyDot:      { color:'#CC1010', fontSize:10, flexShrink:0 },

  // Month matrix view
  legend:        { display:'flex', alignItems:'center', gap:16, marginBottom:14, flexWrap:'wrap' },
  legendItem:    { display:'flex', alignItems:'center', gap:6 },
  legendDot:     { width:24, height:24, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' },

  matrixWrap:    { background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', overflow:'auto' },
  matrix:        { borderCollapse:'collapse', minWidth:800 },
  mth:           { padding:'8px 10px', textAlign:'center', fontSize:11, fontWeight:700, color:'#999', background:'#FAFAFA', borderBottom:'1px solid #EBEBEB', borderLeft:'1px solid #F0F0F0', whiteSpace:'nowrap', position:'sticky', top:0, zIndex:2 },
  mthFixed:      { textAlign:'right', minWidth:160, position:'sticky', right:0, zIndex:3, background:'#FAFAFA', borderLeft:'2px solid #EBEBEB' },
  mtd:           { padding:'8px 10px', textAlign:'center', fontSize:13, borderBottom:'1px solid #F5F5F5', borderLeft:'1px solid #F0F0F0', verticalAlign:'middle', transition:'background 0.15s' },
  mtdFixed:      { textAlign:'right', padding:'10px 14px', position:'sticky', right:0, background:'#fff', borderLeft:'2px solid #EBEBEB', zIndex:1 },

  // Absence summary
  sectionTitle:  { fontSize:18, fontWeight:800, color:'#1A1A1A', marginBottom:4 },
  sectionSub:    { fontSize:13, color:'#999', marginBottom:16 },
  summaryTable:  { background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', overflow:'auto' },
  table:         { width:'100%', borderCollapse:'collapse', minWidth:700 },
  th:            { padding:'13px 16px', textAlign:'right', fontSize:12, fontWeight:700, color:'#999', background:'#FAFAFA', borderBottom:'1px solid #EBEBEB', whiteSpace:'nowrap' },
  tr:            { transition:'background 0.15s' },
  td:            { padding:'13px 16px', fontSize:14, color:'#2D2D2D', borderBottom:'1px solid #F5F5F5', verticalAlign:'middle' },
  tdNum:         { color:'#B0B0B0', fontSize:13, width:40, textAlign:'center' },
  badge:         { display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600 },
  progressBar:   { width:80, height:6, background:'#F0F0F0', borderRadius:3, overflow:'hidden' },
  progressFill:  { height:'100%', borderRadius:3, transition:'width 0.3s ease' },
};
