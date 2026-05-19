import Modal from './Modal';
export default function DeleteConfirmModal({ title = 'تأكيد الحذف', message, subtext, onConfirm, onClose, loading = false, confirmLabel = 'نعم، احذف' }) {
  return (
    <Modal title={title} onClose={onClose} small>
      <div style={{ textAlign:'center', padding:'8px 0 20px' }}>
        <div style={{ fontSize:48, marginBottom:14 }}>⚠️</div>
        {message && <p style={{ color:'#4A4A4A', fontSize:15, marginBottom:6 }}>{message}</p>}
        {subtext  && <p style={{ color:'#999', fontSize:13 }}>{subtext}</p>}
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ padding:'11px 24px', border:'1.5px solid #E0E0E0', borderRadius:9, background:'#fff', color:'#4A4A4A', fontSize:15, fontWeight:600, cursor:'pointer' }}>إلغاء</button>
        <button onClick={onConfirm} disabled={loading} style={{ padding:'11px 28px', border:'none', borderRadius:9, background:'#CC1010', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'جارٍ الحذف...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
