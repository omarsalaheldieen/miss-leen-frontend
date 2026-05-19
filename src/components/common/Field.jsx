export default function Field({ label, children, full = false }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7, ...(full ? { gridColumn:'1/-1' } : {}) }}>
      <label style={{ fontSize:14, fontWeight:600, color:'#1A1A1A' }}>{label}</label>
      {children}
    </div>
  );
}
