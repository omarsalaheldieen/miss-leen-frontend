export default function StatCard({ icon, label, value, color, highlight = false, count = false }) {
  return (
    <div style={{ background: highlight ? '#1A1A1A' : '#fff', border: `1px solid ${highlight ? '#1A1A1A' : '#EBEBEB'}`, borderRadius:12, padding:'20px 22px', display:'flex', alignItems:'center', gap:14, flex:1, minWidth:0 }}>
      <div style={{ width:48, height:48, borderRadius:12, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{icon}</div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:20, fontWeight:800, color: highlight ? '#fff' : color, lineHeight:1.2 }}>
          {count ? value : `${Number(value || 0).toLocaleString('ar-EG')} ج.م`}
        </div>
        <div style={{ fontSize:12, color: highlight ? '#aaa' : '#999', marginTop:2, fontWeight:500 }}>{label}</div>
      </div>
    </div>
  );
}
