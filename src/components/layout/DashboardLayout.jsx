import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

export default function DashboardLayout() {
  const { user, logout, isAdmin, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/login');
  };

  const navItems = [
    hasAnyPermission('view_employees', 'manage_employees') && {
      to: '/employees', label: 'الموظفون',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    hasAnyPermission('view_attendance', 'manage_attendance') && {
      to: '/attendance', label: 'الحضور والغياب',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    hasAnyPermission('view_salary', 'manage_salary') && {
      to: '/salary', label: 'الرواتب',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    },
    hasAnyPermission('view_salary', 'manage_salary') && {
      to: '/cash-advances', label: 'السُّلَف النقدية',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    hasAnyPermission('view_ledger', 'manage_ledger') && {
      to: '/ledger', label: 'الديون والدائنون',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    },
    isAdmin && {
      to: '/users', label: 'المستخدمون',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
    },
  ].filter(Boolean);

  const allRouteLabels = [
    { to: '/employees',    label: 'الموظفون'          },
    { to: '/attendance',   label: 'الحضور والغياب'    },
    { to: '/salary',       label: 'الرواتب'            },
    { to: '/cash-advances',label: 'السُّلَف النقدية'    },
    { to: '/ledger',       label: 'الديون والدائنون'   },
    { to: '/users',        label: 'المستخدمون'        },
  ];
  const currentLabel = allRouteLabels.find(n => window.location.pathname.startsWith(n.to))?.label || 'لوحة التحكم';

  return (
    <div className="shell-layout" style={s.shell}>
      {sidebarOpen && <div style={s.overlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar-el${sidebarOpen ? ' open' : ''}`} style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.logoImgWrap}><img src={logo} alt="Miss Leen" style={s.logoImg}/></div>
          <div style={s.logoSub}>نظام إدارة المصنع</div>
        </div>

        <nav style={s.nav}>
          <div style={s.navLabel}>القائمة الرئيسية</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}) })}>
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          {navItems.length === 0 && <div style={s.noAccessMsg}>لا توجد صلاحيات</div>}
        </nav>

        <div style={s.userArea}>
          <div style={s.userCard}>
            <div style={s.avatar}>{user?.full_name?.[0] || 'م'}</div>
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.full_name}</div>
              <div style={s.userRole}>{user?.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</div>
            </div>
          </div>
          <button onClick={() => setConfirmLogout(true)} style={s.logoutBtn}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div style={s.main}>
        <header style={s.topbar}>
          <button className="menu-btn-el" style={s.menuBtn} onClick={() => setSidebarOpen(o => !o)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="topbar-title-el" style={s.topbarTitle}>{currentLabel}</div>
          <div className="topbar-date-el" style={s.topbarDate}>
            {new Date().toLocaleDateString('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </header>
        <main className="main-content-el" style={s.content}><Outlet /></main>
      </div>

      {confirmLogout && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CC1010" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
            <h3 style={s.modalTitle}>تسجيل الخروج</h3>
            <p style={s.modalMsg}>هل أنت متأكد من تسجيل الخروج من النظام؟</p>
            <div style={s.modalBtns}>
              <button onClick={() => setConfirmLogout(false)} style={s.modalCancelBtn}>إلغاء</button>
              <button onClick={handleLogout} style={s.modalConfirmBtn}>تأكيد الخروج</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  shell:          { display:'flex', minHeight:'100vh', background:'#F5F5F5', direction:'rtl' },
  overlay:        { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:150 },
  sidebar:        { width:260, minHeight:'100vh', background:'#fff', borderLeft:'1px solid #EBEBEB', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', flexShrink:0, boxShadow:'2px 0 12px rgba(0,0,0,0.06)', zIndex:100 },
  sidebarLogo:    { padding:'20px 20px 16px', borderBottom:'1px solid #F0F0F0', textAlign:'center' },
  logoImgWrap:    { display:'flex', justifyContent:'center', alignItems:'center', marginBottom:6 },
  logoImg:        { maxWidth:160, maxHeight:72, width:'auto', height:'auto', objectFit:'contain' },
  logoSub:        { color:'#999', fontSize:11, fontWeight:500, marginTop:2 },
  nav:            { flex:1, padding:'20px 12px', display:'flex', flexDirection:'column', gap:4 },
  navLabel:       { fontSize:12, fontWeight:700, color:'#B0B0B0', letterSpacing:'0.08em', padding:'0 12px 8px', textTransform:'uppercase' },
  navItem:        { display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10, fontSize:15, fontWeight:500, color:'#4A4A4A', transition:'all 0.18s', background:'transparent', textDecoration:'none' },
  navItemActive:  { background:'rgba(204,16,16,0.09)', color:'#CC1010', fontWeight:700 },
  navIcon:        { display:'flex', alignItems:'center' },
  noAccessMsg:    { fontSize:13, color:'#C0C0C0', padding:'12px', textAlign:'center' },
  userArea:       { padding:'16px', borderTop:'1px solid #F0F0F0' },
  userCard:       { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  avatar:         { width:38, height:38, borderRadius:'50%', background:'#CC1010', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, flexShrink:0 },
  userInfo:       { flex:1, minWidth:0 },
  userName:       { fontWeight:700, fontSize:13, color:'#1A1A1A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  userRole:       { fontSize:11, color:'#999', marginTop:1 },
  logoutBtn:      { width:'100%', padding:'9px 14px', background:'transparent', border:'1.5px solid #E8E8E8', borderRadius:8, color:'#767676', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7, cursor:'pointer' },
  main:           { flex:1, display:'flex', flexDirection:'column', minWidth:0 },
  topbar:         { height:66, background:'#fff', borderBottom:'1px solid #EBEBEB', display:'flex', alignItems:'center', padding:'0 28px', gap:16, position:'sticky', top:0, zIndex:10, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' },
  menuBtn:        { background:'none', border:'none', color:'#4A4A4A', display:'flex', alignItems:'center', padding:6, borderRadius:8, cursor:'pointer', flexShrink:0 },
  topbarTitle:    { fontWeight:700, fontSize:18, color:'#1A1A1A', flex:1 },
  topbarDate:     { fontSize:13, color:'#B0B0B0', fontWeight:500, whiteSpace:'nowrap' },
  content:        { flex:1, padding:28, width:'100%' },
  modalOverlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' },
  modal:          { background:'#fff', borderRadius:18, padding:'40px 36px 32px', maxWidth:380, width:'90%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  modalIcon:      { display:'flex', justifyContent:'center', marginBottom:16 },
  modalTitle:     { fontSize:20, fontWeight:800, color:'#1A1A1A', marginBottom:8 },
  modalMsg:       { color:'#767676', fontSize:14, marginBottom:28 },
  modalBtns:      { display:'flex', gap:10 },
  modalCancelBtn: { flex:1, padding:'12px', border:'1.5px solid #E0E0E0', borderRadius:9, background:'#fff', color:'#4A4A4A', fontSize:14, fontWeight:600, cursor:'pointer' },
  modalConfirmBtn:{ flex:1, padding:'12px', border:'none', borderRadius:9, background:'#CC1010', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' },
};
