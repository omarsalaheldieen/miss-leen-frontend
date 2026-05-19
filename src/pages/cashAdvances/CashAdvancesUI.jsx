import { formatMonth } from '../../utils/formatters';
import { s } from './cashAdvances.styles';

export function CAStatCard({ label, value, icon, color, highlight, count }) {
  return (
    <div style={{ background: highlight ? '#1A1A1A' : '#fff', border: `1px solid ${highlight ? '#1A1A1A' : '#EBEBEB'}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: count ? 20 : 16, fontWeight: 800, color: highlight ? '#fff' : color, lineHeight: 1.2 }}>
          {count ? value : `${Number(value).toLocaleString('ar-EG')} ج.م`}
        </div>
        <div style={{ fontSize: 11, color: highlight ? '#aaa' : '#999', marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export function CAField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{label}</label>
      {children}
    </div>
  );
}

export function CAPreviewRow({ label, value, red }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F0F0F0' }}>
      <span style={{ fontSize: 13, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: red ? '#CC1010' : '#1A1A1A' }}>{value}</span>
    </div>
  );
}

export function CAModal({ title, onClose, children, small }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.25s ease', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ padding: '20px 20px 32px' }}>{children}</div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

export function CATable({ advances, canManage, onEdit, onDelete }) {
  return (
    <table style={s.table}>
      <thead>
        <tr>{['#', 'الموظف', 'الشهر', 'التاريخ', 'المبلغ', 'السبب', canManage ? 'إجراءات' : ''].filter(Boolean).map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {advances.map((adv, idx) => (
          <tr key={adv.id} style={s.tr}>
            <td style={{ ...s.td, ...s.tdNum }}>{idx + 1}</td>
            <td style={s.td}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...s.empAvatar, background: adv.gender === 'female' ? '#FFF0F6' : '#EBF5FF' }}>{adv.gender === 'male' ? '👨' : '👩'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{adv.employee_name}</div>
                  {adv.department && <div style={{ fontSize: 11, color: '#B0B0B0' }}>{adv.department}</div>}
                </div>
              </div>
            </td>
            <td style={{ ...s.td, fontWeight: 600, color: '#555' }}>{formatMonth(adv.month)}</td>
            <td style={{ ...s.td, fontSize: 13, color: '#767676', direction: 'ltr', textAlign: 'center' }}>{adv.date}</td>
            <td style={s.td}><span style={s.amountBadge}>- {Number(adv.amount).toLocaleString('ar-EG')} ج.م</span></td>
            <td style={{ ...s.td, color: '#767676', fontSize: 13 }}>{adv.reason || <span style={{ color: '#C0C0C0' }}>—</span>}</td>
            {canManage && (
              <td style={s.td}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => onEdit(adv)} style={s.editBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>تعديل
                  </button>
                  <button onClick={() => onDelete(adv)} style={s.deleteBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>حذف
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CAMobileList({ advances, canManage, onEdit, onDelete }) {
  return (
    <div className="ca-mobile-list" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
      {advances.map(adv => (
        <div key={adv.id} style={s.mobileCard}>
          <div style={s.mobileCardTop}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ ...s.empAvatar, background: adv.gender === 'female' ? '#FFF0F6' : '#EBF5FF', flexShrink: 0 }}>{adv.gender === 'male' ? '👨' : '👩'}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A' }}>{adv.employee_name}</div>
                {adv.department && <div style={{ fontSize: 11, color: '#B0B0B0' }}>{adv.department}</div>}
              </div>
            </div>
            <span style={s.amountBadge}>- {Number(adv.amount).toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div style={s.mobileCardMeta}>
            <span style={s.metaItem}>{formatMonth(adv.month)}</span>
            <span style={s.metaItem}>{adv.date}</span>
          </div>
          {adv.reason && <div style={s.mobileCardReason}>"{adv.reason}"</div>}
          {canManage && (
            <div style={s.mobileCardActions}>
              <button onClick={() => onEdit(adv)} style={{ ...s.editBtn, flex: 1, justifyContent: 'center' }}>تعديل</button>
              <button onClick={() => onDelete(adv)} style={{ ...s.deleteBtn, flex: 1, justifyContent: 'center' }}>حذف</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CAForm({ form, setForm, editItem, employees, saving, onSubmit, onClose }) {
  return (
    <form onSubmit={onSubmit}>
      <div style={s.modalNote}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        ستُخصم هذه السلفة من صافي راتب الموظف عن الشهر المحدد
      </div>
      <div className="ca-form-grid" style={s.formGrid}>
        <CAField label="الموظف *">
          <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} style={s.input} required disabled={!!editItem}>
            <option value="">اختر الموظف</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ''}</option>)}
          </select>
        </CAField>
        <CAField label="المبلغ (ج.م) *">
          <input type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="مثال: 500" style={s.input} required />
        </CAField>
        <CAField label="الشهر المخصوم منه *">
          <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} style={s.input} required />
        </CAField>
        <CAField label="تاريخ الصرف *">
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={s.input} required />
        </CAField>
      </div>
      <CAField label="سبب السلفة">
        <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="مثال: ظروف عائلية، مصاريف طارئة..." style={{ ...s.input, marginBottom: 20 }} />
      </CAField>
      {form.employee_id && form.amount && Number(form.amount) > 0 && form.month && (() => {
        const emp = employees.find(e => String(e.id) === String(form.employee_id));
        if (!emp) return null;
        const base = emp.daily_wage * 26;
        const adv = Number(form.amount);
        return (
          <div style={s.previewBox}>
            <div style={s.previewTitle}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CC1010" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              تأثير السلفة على الراتب
            </div>
            <CAPreviewRow label="الراتب الأساسي (26 يوم)" value={`${base.toLocaleString('ar-EG')} ج.م`} />
            <CAPreviewRow label="خصم السلفة" value={`- ${adv.toLocaleString('ar-EG')} ج.م`} red />
            <div style={s.previewNetRow}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>الراتب بعد خصم السلفة (تقريبي)</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#CC1010' }}>{(base - adv).toLocaleString('ar-EG')} ج.م</span>
            </div>
          </div>
        );
      })()}
      <div style={s.modalFooter}>
        <button type="button" onClick={onClose} style={s.cancelBtn}>إلغاء</button>
        <button type="submit" disabled={saving} style={s.submitBtn}>{saving ? 'جارٍ الحفظ...' : editItem ? 'حفظ التعديلات' : 'تسجيل السلفة'}</button>
      </div>
    </form>
  );
}

export function CADeleteConfirm({ target, deleting, onConfirm, onClose }) {
  return (
    <>
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: '#4A4A4A', fontSize: 15, marginBottom: 6 }}>هل تريد حذف سلفة</p>
        <p style={{ color: '#CC1010', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{target.employee_name}</p>
        <p style={{ color: '#999', fontSize: 14 }}>بمبلغ <strong>{Number(target.amount).toLocaleString('ar-EG')} ج.م</strong> عن {formatMonth(target.month)}</p>
      </div>
      <div style={s.modalFooter}>
        <button onClick={onClose} style={s.cancelBtn}>إلغاء</button>
        <button onClick={onConfirm} disabled={deleting} style={{ ...s.submitBtn, background: '#CC1010' }}>{deleting ? 'جارٍ الحذف...' : 'نعم، احذف'}</button>
      </div>
    </>
  );
}
