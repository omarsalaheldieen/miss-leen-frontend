export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header-el" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, gap:16 }}>
      <div>
        <h1 style={{ fontSize:26, fontWeight:800, color:'#1A1A1A', margin:0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:15, color:'#999', marginTop:4, fontWeight:500 }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', flexShrink:0 }}>{children}</div>}
    </div>
  );
}

export function ActionButton({ onClick, children, variant = 'primary', style: extraStyle = {} }) {
  const variants = {
    primary:   { background:'#CC1010', color:'#fff', boxShadow:'0 4px 14px rgba(204,16,16,0.25)', border:'none' },
    secondary: { background:'#fff',    color:'#1A6EB0', border:'1.5px solid #1A6EB0' },
    purple:    { background:'#7B2FBE', color:'#fff', boxShadow:'0 4px 14px rgba(123,47,190,0.25)', border:'none' },
  };
  return (
    <button onClick={onClick} className="add-btn-el" style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', ...variants[variant], ...extraStyle }}>
      {children}
    </button>
  );
}
