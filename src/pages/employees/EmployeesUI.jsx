import { s } from './employees.styles';

export function EmpStatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export function EmpModal({ title, onClose, children, small }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-inner-el" style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: small ? 380 : 680, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.25s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid #F0F0F0' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ padding: '24px 28px 28px' }}>{children}</div>
      </div>
    </div>
  );
}

export function EmpFormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{label}</label>
      {children}
    </div>
  );
}

export function EmpTable({ filtered, canManage, onEdit, onDelete }) {
  const genderLabel = (g) => g === 'male' ? 'ذكر' : 'أنثى';
  const genderColor = (g) => g === 'male' ? { bg: '#EBF5FF', color: '#1A6EB0' } : { bg: '#FFF0F6', color: '#B03076' };
  const WORK_DAYS = 26;
  return (
    <table style={s.table}>
      <thead>
        <tr>
          {['#', 'الاسم', 'الهاتف', 'الجنس', 'الأجر اليومي', 'الراتب الشهري (×26)', 'القسم', 'تاريخ الإضافة', canManage ? 'إجراءات' : ''].filter(Boolean).map(h => (
            <th key={h} style={s.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map((emp, idx) => (
          <tr key={emp.id} style={s.tr}>
            <td style={{ ...s.td, ...s.tdNum }}>{idx + 1}</td>
            <td style={s.td}>
              <div style={s.nameCell}>
                <div style={{ ...s.empAvatar, background: emp.gender === 'female' ? '#FFF0F6' : '#EBF5FF' }}>
                  <span style={{ fontSize: 14 }}>{emp.gender === 'male' ? '👨' : '👩'}</span>
                </div>
                <span style={s.empName}>{emp.name}</span>
              </div>
            </td>
            <td style={{ ...s.td, direction: 'ltr', textAlign: 'center' }}>{emp.phone}</td>
            <td style={s.td}>
              <span style={{ ...s.badge, background: genderColor(emp.gender).bg, color: genderColor(emp.gender).color }}>
                {genderLabel(emp.gender)}
              </span>
            </td>
            <td style={{ ...s.td, fontWeight: 600, color: '#1A6EB0' }}>
              {Number(emp.daily_wage).toLocaleString('ar-EG')}<span style={{ fontSize: 11, fontWeight: 400, color: '#999', marginRight: 3 }}>ج.م/يوم</span>
            </td>
            <td style={{ ...s.td, fontWeight: 700, color: '#0A7A4E' }}>
              {(Number(emp.daily_wage) * WORK_DAYS).toLocaleString('ar-EG')}<span style={{ fontSize: 11, fontWeight: 400, color: '#999', marginRight: 3 }}>ج.م</span>
            </td>
            <td style={{ ...s.td, color: '#767676' }}>{emp.department || '—'}</td>
            <td style={{ ...s.td, fontSize: 12, color: '#B0B0B0' }}>{new Date(emp.created_at).toLocaleDateString('ar-EG')}</td>
            {canManage && (
              <td style={s.td}>
                <div style={s.actionBtns}>
                  <button onClick={() => onEdit(emp)} style={s.editBtn}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    تعديل
                  </button>
                  <button onClick={() => onDelete(emp)} style={s.deleteBtn}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                    حذف
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

export function EmpForm({ form, setForm, editItem, saving, onSubmit, onClose, WORK_DAYS }) {
  return (
    <form onSubmit={onSubmit} style={{}}>
      <div className="form-grid-el" style={s.formGrid}>
        <EmpFormField label="الاسم الكامل *">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="أدخل اسم الموظف" style={s.input} required />
        </EmpFormField>
        <EmpFormField label="رقم الهاتف *">
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" style={s.input} required />
        </EmpFormField>
        <EmpFormField label="الجنس *">
          <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={s.input} required>
            <option value="">اختر الجنس</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </EmpFormField>
        <EmpFormField label="الأجر اليومي (ج.م) *">
          <input type="number" min="0" step="0.01" value={form.daily_wage} onChange={e => setForm(f => ({ ...f, daily_wage: e.target.value }))} placeholder="مثال: 120" style={s.input} required />
          {form.daily_wage && (
            <span style={{ fontSize: 12, color: '#0A7A4E', marginTop: 4, fontWeight: 600 }}>
              الراتب الشهري: {(Number(form.daily_wage) * WORK_DAYS).toLocaleString('ar-EG')} ج.م
            </span>
          )}
        </EmpFormField>
        <EmpFormField label="القسم">
          <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="مثال: الإنتاج، التعبئة" style={s.input} />
        </EmpFormField>
        <EmpFormField label="ملاحظات">
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="أي ملاحظات إضافية" style={s.input} />
        </EmpFormField>
      </div>
      <div style={s.modalFooter}>
        <button type="button" onClick={onClose} style={s.cancelBtn}>إلغاء</button>
        <button type="submit" disabled={saving} style={s.submitBtn}>
          {saving ? 'جارٍ الحفظ...' : editItem ? 'حفظ التعديلات' : 'إضافة الموظف'}
        </button>
      </div>
    </form>
  );
}

export function EmpDeleteConfirm({ target, deleting, onConfirm, onClose }) {
  return (
    <>
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: '#4A4A4A', fontSize: 15, marginBottom: 8 }}>هل أنت متأكد من حذف الموظف</p>
        <p style={{ color: '#CC1010', fontWeight: 700, fontSize: 17, marginBottom: 20 }}>"{target.name}"</p>
        <p style={{ color: '#999', fontSize: 13 }}>لا يمكن التراجع عن هذا الإجراء</p>
      </div>
      <div style={s.modalFooter}>
        <button onClick={onClose} style={s.cancelBtn}>إلغاء</button>
        <button onClick={onConfirm} disabled={deleting} style={{ ...s.submitBtn, background: '#CC1010' }}>
          {deleting ? 'جارٍ الحذف...' : 'نعم، احذف'}
        </button>
      </div>
    </>
  );
}
