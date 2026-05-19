
// ─── Shared: No Access screen ────────────────────────────────────────────────
export function NoAccess({ page }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40,
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', marginBottom: 10 }}>
        ليس لديك صلاحية
      </h2>
      <p style={{ fontSize: 15, color: '#999', maxWidth: 340, lineHeight: 1.7 }}>
        لا تملك صلاحية الوصول إلى صفحة <strong style={{ color: '#CC1010' }}>{page}</strong>.
        تواصل مع المدير لتفعيل الصلاحية المطلوبة.
      </p>
      <div style={{
        marginTop: 28, padding: '12px 20px', background: '#FFF5F5',
        border: '1px solid rgba(204,16,16,0.2)', borderRadius: 10,
        fontSize: 13, color: '#CC1010', fontWeight: 500,
      }}>
        🔑 تحتاج صلاحية: عرض {page} أو إدارة {page}
      </div>
    </div>
  );
}
