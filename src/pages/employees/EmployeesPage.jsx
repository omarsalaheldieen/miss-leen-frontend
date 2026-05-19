import { useAuth } from '../../hooks/useAuth';
import { NoAccess } from '../NoAccess';
import { useEmployees } from './useEmployees';
import { EmpStatCard, EmpModal, EmpTable, EmpForm, EmpDeleteConfirm } from './EmployeesUI';
import { s } from './employees.styles';

export default function EmployeesPage() {
  const { hasPermission, hasAnyPermission } = useAuth();

  if (!hasAnyPermission('view_employees', 'manage_employees'))
    return <NoAccess page="الموظفون" />;

  const canManage = hasPermission('manage_employees');
  const ctx = useEmployees();

  return (
    <div style={s.page}>
      {/* Header */}
      <div className="page-header-el" style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>الموظفون</h1>
          <p style={s.pageSubtitle}>إدارة بيانات موظفي المصنع</p>
        </div>
        {canManage && (
          <button className="add-btn-el" onClick={ctx.openAdd} style={s.addBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            إضافة موظف
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-row-el" style={s.statsRow}>
        <EmpStatCard label="إجمالي الموظفين"        value={ctx.employees.length}                                icon="👥" color="#CC1010" />
        <EmpStatCard label="الذكور"                  value={ctx.employees.filter(e => e.gender === 'male').length}   icon="👨" color="#1A6EB0" />
        <EmpStatCard label="الإناث"                  value={ctx.employees.filter(e => e.gender === 'female').length} icon="👩" color="#B03076" />
        <EmpStatCard label="إجمالي الرواتب الشهرية" value={`${ctx.totalMonthly.toLocaleString('ar-EG')} ج.م`}       icon="💰" color="#0A7A4E" />
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="البحث عن موظف..." value={ctx.search} onChange={e => ctx.setSearch(e.target.value)} style={s.searchInput} />
        {ctx.search && (
          <button onClick={() => ctx.setSearch('')} style={s.clearBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap-el" style={s.tableWrap}>
        {ctx.loading ? (
          <div style={s.loadingState}><div style={s.spinner} /><p>جارٍ التحميل...</p></div>
        ) : ctx.filtered.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>👥</div>
            <p style={s.emptyText}>{ctx.search ? 'لا توجد نتائج مطابقة' : 'لا يوجد موظفون حتى الآن'}</p>
            {!ctx.search && canManage && <button onClick={ctx.openAdd} style={s.emptyBtn}>إضافة أول موظف</button>}
          </div>
        ) : (
          <EmpTable filtered={ctx.filtered} canManage={canManage} onEdit={ctx.openEdit} onDelete={ctx.setDeleteTarget} />
        )}
      </div>

      {/* Add/Edit Modal */}
      {ctx.showModal && (
        <EmpModal title={ctx.editItem ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'} onClose={ctx.closeModal}>
          <EmpForm form={ctx.form} setForm={ctx.setForm} editItem={ctx.editItem} saving={ctx.saving} onSubmit={ctx.handleSave} onClose={ctx.closeModal} WORK_DAYS={ctx.WORK_DAYS} />
        </EmpModal>
      )}

      {/* Delete Modal */}
      {ctx.deleteTarget && (
        <EmpModal title="تأكيد الحذف" onClose={() => ctx.setDeleteTarget(null)} small>
          <EmpDeleteConfirm target={ctx.deleteTarget} deleting={ctx.deleting} onConfirm={ctx.handleDelete} onClose={() => ctx.setDeleteTarget(null)} />
        </EmpModal>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        input:focus, select:focus { outline:none; border-color:#CC1010!important; box-shadow:0 0 0 3px rgba(204,16,16,0.1)!important; }
        tr:hover td { background:#FAFAFA; }
        @media(max-width:640px){
          .page-header-el{flex-direction:column!important;align-items:stretch!important;gap:12px!important;}
          .add-btn-el{width:100%!important;justify-content:center!important;}
          .stats-row-el{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;}
          .form-grid-el{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
