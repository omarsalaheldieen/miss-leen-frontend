import { useAuth } from '../../hooks/useAuth';
import { NoAccess } from '../NoAccess';
import { formatMonth } from '../../utils/formatters';
import { useCashAdvances } from './useCashAdvances';
import { CAStatCard, CAModal, CATable, CAMobileList, CAForm, CADeleteConfirm } from './CashAdvancesUI';
import { s } from './cashAdvances.styles';

export default function CashAdvancesPage() {
  const { hasPermission, hasAnyPermission } = useAuth();

  if (!hasAnyPermission('view_salary', 'manage_salary'))
    return <NoAccess page="السلف" />;

  const canManage = hasPermission('manage_salary');
  const ctx = useCashAdvances();

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="ca-page-header" style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>السُّلَف النقدية</h1>
          <p style={s.pageSubtitle}>تسجيل ومتابعة السلف — تُخصم تلقائياً من صافي الراتب عند إعداده</p>
        </div>
        {canManage && (
          <button onClick={ctx.openAdd} className="ca-add-btn" style={s.addBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            تسجيل سلفة
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="ca-filter-row" style={s.filterRow}>
        <div style={s.filterLabel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC1010" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          تصفية بالشهر:
        </div>
        <input type="month" value={ctx.filterMonth} onChange={e => ctx.setFilterMonth(e.target.value)} style={s.monthInput} />
        {ctx.filterMonth && <button onClick={() => ctx.setFilterMonth('')} style={s.clearFilterBtn}>عرض الكل</button>}
      </div>

      {/* Stats */}
      {ctx.advances.length > 0 && (
        <div className="ca-stats-row" style={s.statsRow}>
          <CAStatCard label="إجمالي السلف"           value={ctx.totalAdvance}                      icon="💸" color="#CC1010" highlight />
          <CAStatCard label="عدد السلف المسجلة"      value={ctx.advances.length}                   icon="📋" color="#1A6EB0" count />
          <CAStatCard label="عدد الموظفين المستلفين" value={Object.keys(ctx.byEmployee).length}    icon="👥" color="#0A7A4E" count />
          {ctx.topEmp && <CAStatCard label={`أعلى سلفة — ${ctx.topEmp.name}`} value={ctx.topBorrower[1]} icon="📌" color="#7B2FBE" />}
        </div>
      )}

      {/* Info banner */}
      <div style={s.infoBanner}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A6EB0" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        <span>السلفة المسجلة لشهر معين <strong>تُخصم تلقائياً</strong> من صافي راتب الموظف عند إعداد الراتب.</span>
      </div>

      {/* Table / Empty */}
      {ctx.loading ? (
        <div style={s.centered}><div style={s.spinner} /><p style={{ color: '#999', marginTop: 14 }}>جارٍ التحميل...</p></div>
      ) : ctx.advances.length === 0 ? (
        <div style={s.centered}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💸</div>
          <p style={{ color: '#999', fontSize: 15, marginBottom: 16 }}>{ctx.filterMonth ? `لا توجد سلف في ${formatMonth(ctx.filterMonth)}` : 'لا توجد سلف مسجلة بعد'}</p>
          {canManage && <button onClick={ctx.openAdd} style={s.addBtn}>تسجيل أول سلفة</button>}
        </div>
      ) : (
        <>
          <div className="ca-table-wrap" style={s.tableWrap}>
            <CATable advances={ctx.advances} canManage={canManage} onEdit={ctx.openEdit} onDelete={ctx.setDeleteTarget} />
          </div>
          <CAMobileList advances={ctx.advances} canManage={canManage} onEdit={ctx.openEdit} onDelete={ctx.setDeleteTarget} />
        </>
      )}

      {/* Add/Edit Modal */}
      {ctx.showModal && (
        <CAModal title={ctx.editItem ? 'تعديل السلفة' : 'تسجيل سلفة نقدية جديدة'} onClose={ctx.closeModal}>
          <CAForm form={ctx.form} setForm={ctx.setForm} editItem={ctx.editItem} employees={ctx.employees} saving={ctx.saving} onSubmit={ctx.handleSave} onClose={ctx.closeModal} />
        </CAModal>
      )}

      {/* Delete Modal */}
      {ctx.deleteTarget && (
        <CAModal title="حذف السلفة" onClose={() => ctx.setDeleteTarget(null)} small>
          <CADeleteConfirm target={ctx.deleteTarget} deleting={ctx.deleting} onConfirm={ctx.handleDelete} onClose={() => ctx.setDeleteTarget(null)} />
        </CAModal>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus{outline:none;border-color:#CC1010!important;box-shadow:0 0 0 3px rgba(204,16,16,0.1)!important}
        tr:hover td{background:#FAFAFA}
        @media(max-width:640px){
          .ca-page-header{flex-direction:column!important;align-items:stretch!important;gap:12px!important;}
          .ca-add-btn{width:100%!important;justify-content:center!important;}
          .ca-filter-row{flex-wrap:wrap!important;gap:8px!important;}
          .ca-stats-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;}
          .ca-table-wrap{display:none!important;}
          .ca-mobile-list{display:flex!important;}
          .ca-form-grid{grid-template-columns:1fr!important;}
        }
        @media(min-width:641px){
          .ca-mobile-list{display:none!important;}
          .ca-table-wrap{display:block!important;}
        }
      `}</style>
    </div>
  );
}
