export default function Modal({ title, onClose, children, small = false }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="modal-inner-el" style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth: small ? 440 : 760, maxHeight:'92vh', overflowY:'auto', animation:'fadeIn 0.25s ease', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 28px', borderBottom:'1px solid #F0F0F0', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
          <h3 style={{ fontSize:19, fontWeight:800, color:'#1A1A1A', margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#999', cursor:'pointer', display:'flex', padding:4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'24px 28px 28px' }}>{children}</div>
      </div>
    </div>
  );
}
