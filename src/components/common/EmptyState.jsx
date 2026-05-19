export default function EmptyState({ icon = '📋', message, onAdd, addLabel = 'إضافة جديد' }) {
  return (
    <div style={{ textAlign:'center', padding:'64px 20px' }}>
      <div style={{ fontSize:52, marginBottom:14 }}>{icon}</div>
      <p style={{ color:'#999', fontSize:15, marginBottom:20 }}>{message}</p>
      {onAdd && (
        <button onClick={onAdd} style={{ padding:'12px 28px', background:'#CC1010', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(204,16,16,0.25)' }}>
          {addLabel}
        </button>
      )}
    </div>
  );
}
