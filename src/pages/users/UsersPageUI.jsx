// All UI rendering for UsersPage — receives ctx from useUsers hook
const s = {
  page:{ animation:'fadeIn 0.3s ease' },
  pageHeader:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, gap:16 },
  pageTitle:{ fontSize:26, fontWeight:800, color:'#1A1A1A', margin:0 },
  pageSubtitle:{ fontSize:15, color:'#999', marginTop:4, fontWeight:500 },
  addBtn:{ display:'flex', alignItems:'center', gap:8, padding:'13px 26px', background:'#CC1010', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(204,16,16,0.25)', flexShrink:0 },
  statsRow:{ display:'flex', gap:16, marginBottom:26, flexWrap:'wrap' },
  tableWrap:{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', overflow:'auto' },
  centered:{ textAlign:'center', padding:'64px 20px' },
  spinner:{ width:38, height:38, border:'3px solid #F0F0F0', borderTopColor:'#CC1010', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' },
  table:{ width:'100%', borderCollapse:'collapse', minWidth:640 },
  th:{ padding:'15px 18px', textAlign:'right', fontSize:13, fontWeight:700, color:'#999', background:'#FAFAFA', borderBottom:'1px solid #EBEBEB' },
  tr:{ transition:'background 0.15s' },
  td:{ padding:'15px 18px', fontSize:15, color:'#2D2D2D', borderBottom:'1px solid #F5F5F5', verticalAlign:'middle' },
  tdNum:{ color:'#B0B0B0', fontSize:14, width:44, textAlign:'center' },
  avatar:{ width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17, flexShrink:0 },
  badge:{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:99, fontSize:13, fontWeight:600 },
  actionBtns:{ display:'flex', gap:8 },
  editBtn:{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#F0F7FF', color:'#1A6EB0', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  deleteBtn:{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#FFF5F5', color:'#CC1010', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  mobileCard:{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', gap:12 },
  formGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px 22px', marginBottom:26 },
  input:{ padding:'12px 16px', fontSize:15, fontFamily:'Cairo,sans-serif', border:'1.5px solid #E8E8E8', borderRadius:9, background:'#FAFAFA', color:'#1A1A1A', direction:'rtl', width:'100%' },
  permsSection:{ marginBottom:24 },
  permsSectionHeader:{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:8 },
  permsSectionTitle:{ fontSize:16, fontWeight:800, color:'#1A1A1A' },
  permsSectionSub:{ fontSize:13, color:'#999' },
  permHint:{ fontSize:13, color:'#666', background:'#FFFBEB', border:'1px solid #F0E68C', borderRadius:8, padding:'9px 14px', marginBottom:14 },
  selectedSummary:{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', marginBottom:16, padding:'10px 14px', background:'#F9F9F9', borderRadius:10, border:'1px solid #EBEBEB' },
  selectedLabel:{ fontSize:13, color:'#999', fontWeight:600, flexShrink:0 },
  removeBadgeBtn:{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'inherit', opacity:0.6, padding:'0 0 0 4px', lineHeight:1 },
  permGroup:{ marginBottom:14, border:'1px solid #EBEBEB', borderRadius:12, overflow:'hidden' },
  permGroupHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', background:'#FAFAFA', borderBottom:'1px solid #EBEBEB' },
  permGroupIcon:{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 },
  permGroupTitle:{ fontSize:15, fontWeight:700, color:'#1A1A1A' },
  selectAllBtn:{ fontSize:13, fontWeight:600, padding:'6px 14px', border:'1.5px solid #E0E0E0', borderRadius:20, background:'#fff', color:'#555', cursor:'pointer' },
  permItems:{ display:'flex', flexDirection:'column' },
  permItem:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, padding:'14px 18px', borderBottom:'1px solid #F5F5F5', cursor:'pointer', border:'1.5px solid transparent', background:'#fff' },
  checkMark:{ fontSize:17, fontWeight:700, flexShrink:0 },
  adminNotice:{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'rgba(204,16,16,0.05)', border:'1.5px solid rgba(204,16,16,0.15)', borderRadius:12, marginBottom:24 },
  modalFooter:{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 },
  cancelBtn:{ padding:'12px 26px', border:'1.5px solid #E0E0E0', borderRadius:9, background:'#fff', color:'#4A4A4A', fontSize:15, fontWeight:600, cursor:'pointer' },
  submitBtn:{ padding:'12px 30px', border:'none', borderRadius:9, background:'#CC1010', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' },
};

function StatCard({icon,label,value,color}){return(<div style={{background:'#fff',border:'1px solid #EBEBEB',borderRadius:12,padding:'20px 22px',display:'flex',alignItems:'center',gap:14,flex:1,minWidth:0}}><div style={{width:48,height:48,borderRadius:12,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{icon}</div><div><div style={{fontSize:24,fontWeight:800,color:'#1A1A1A',lineHeight:1.2}}>{value}</div><div style={{fontSize:13,color:'#999',marginTop:2,fontWeight:500}}>{label}</div></div></div>);}
function FormField({label,children}){return(<div style={{display:'flex',flexDirection:'column',gap:7}}><label style={{fontSize:14,fontWeight:600,color:'#1A1A1A'}}>{label}</label>{children}</div>);}
function Modal({title,onClose,children,small}){return(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div className="modal-inner-el" style={{background:'#fff',borderRadius:18,width:'100%',maxWidth:small?440:680,maxHeight:'92vh',overflowY:'auto',animation:'fadeIn 0.25s ease',boxShadow:'0 24px 64px rgba(0,0,0,0.2)'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'24px 30px',borderBottom:'1px solid #F0F0F0',position:'sticky',top:0,background:'#fff',zIndex:1}}><h3 style={{fontSize:19,fontWeight:800,color:'#1A1A1A',margin:0}}>{title}</h3><button onClick={onClose} style={{background:'none',border:'none',color:'#999',cursor:'pointer',display:'flex',padding:4}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div style={{padding:'26px 30px 30px'}}>{children}</div></div></div>);}

export default function UsersPageUI({ ctx }) {
  const { users, loading, showModal, editItem, form, setForm, saving, deleteTarget, setDeleteTarget, deleting, PERMISSION_GROUPS, openAdd, openEdit, closeModal, togglePerm, toggleGroup, handleSave, handleDelete, permLabel, permGroup } = ctx;

  return (
    <div style={s.page}>
      <div className="page-header-el" style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>المستخدمون</h1>
          <p style={s.pageSubtitle}>إدارة حسابات المستخدمين وصلاحياتهم</p>
        </div>
        <button className="add-btn-el" onClick={openAdd} style={s.addBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة مستخدم
        </button>
      </div>

      <div style={s.statsRow} className="stats-row-el">
        <StatCard icon="👤" label="إجمالي المستخدمين"   value={users.length}                            color="#CC1010"/>
        <StatCard icon="🛡️" label="المديرون"            value={users.filter(u=>u.role==='admin').length} color="#CC1010"/>
        <StatCard icon="👁️" label="المستخدمون العاديون" value={users.filter(u=>u.role!=='admin').length} color="#1A6EB0"/>
        <StatCard icon="✅" label="الحسابات النشطة"     value={users.filter(u=>u.is_active).length}      color="#0A7A4E"/>
      </div>

      <div className="table-wrap-el" style={s.tableWrap}>
        {loading ? (
          <div style={s.centered}><div style={s.spinner}/><p style={{color:'#999',marginTop:14}}>جارٍ التحميل...</p></div>
        ) : users.length === 0 ? (
          <div style={s.centered}><div style={{fontSize:50,marginBottom:12}}>👤</div><p style={{color:'#999',fontSize:15}}>لا يوجد مستخدمون</p></div>
        ) : (
          <table style={s.table}>
            <thead><tr>{['#','الاسم الكامل','اسم المستخدم','الدور','الصلاحيات','الحالة','إجراءات'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u,idx)=>(
                <tr key={u.id} style={s.tr}>
                  <td style={{...s.td,...s.tdNum}}>{idx+1}</td>
                  <td style={s.td}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{...s.avatar,background:u.role==='admin'?'rgba(204,16,16,0.1)':'#F0F7FF',color:u.role==='admin'?'#CC1010':'#1A6EB0'}}>{u.full_name?.[0]||'م'}</div>
                      <span style={{fontWeight:600}}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{...s.td,color:'#767676',fontFamily:'monospace',fontSize:13}}>{u.username}</td>
                  <td style={s.td}><span style={{...s.badge,...(u.role==='admin'?{background:'rgba(204,16,16,0.1)',color:'#CC1010'}:{background:'#F0F7FF',color:'#1A6EB0'})}}>{u.role==='admin'?'مدير':'مستخدم'}</span></td>
                  <td style={s.td}>
                    {u.role==='admin'?<span style={{...s.badge,background:'rgba(204,16,16,0.08)',color:'#CC1010'}}>كل الصلاحيات</span>
                    :(u.permissions||[]).length===0?<span style={{color:'#C0C0C0',fontSize:13}}>لا توجد صلاحيات</span>
                    :<div style={{display:'flex',flexWrap:'wrap',gap:4}}>{(u.permissions||[]).map(p=>{const grp=permGroup(p);return<span key={p} style={{...s.badge,fontSize:11,background:grp?.bg||'#F5F5F5',color:grp?.color||'#666'}}>{grp?.icon} {permLabel(p)}</span>})}</div>}
                  </td>
                  <td style={s.td}><span style={{...s.badge,...(u.is_active?{background:'#E8F8F0',color:'#0A7A4E'}:{background:'#F5F5F5',color:'#999'})}}>{u.is_active?'نشط':'موقوف'}</span></td>
                  <td style={s.td}>
                    <div style={s.actionBtns}>
                      <button onClick={()=>openEdit(u)} style={s.editBtn}>تعديل</button>
                      {u.username!=='admin'&&<button onClick={()=>setDeleteTarget(u)} style={s.deleteBtn}>حذف</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      {!loading && users.length > 0 && (
        <div className="usr-mobile-list" style={{display:'none',flexDirection:'column',gap:10}}>
          {users.map(u=>(
            <div key={u.id} style={s.mobileCard}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{...s.avatar,width:42,height:42,fontSize:18,background:u.role==='admin'?'rgba(204,16,16,0.1)':'#F0F7FF',color:u.role==='admin'?'#CC1010':'#1A6EB0',flexShrink:0}}>{u.full_name?.[0]||'م'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15}}>{u.full_name}</div>
                  <div style={{fontSize:12,color:'#999',fontFamily:'monospace',marginTop:1}}>{u.username}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                  <span style={{...s.badge,...(u.role==='admin'?{background:'rgba(204,16,16,0.1)',color:'#CC1010'}:{background:'#F0F7FF',color:'#1A6EB0'})}}>{u.role==='admin'?'مدير':'مستخدم'}</span>
                  <span style={{...s.badge,...(u.is_active?{background:'#E8F8F0',color:'#0A7A4E'}:{background:'#F5F5F5',color:'#999'})}}>{u.is_active?'نشط':'موقوف'}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:8,borderTop:'1px solid #F0F0F0',paddingTop:10}}>
                <button onClick={()=>openEdit(u)} style={{...s.editBtn,flex:1,justifyContent:'center'}}>تعديل</button>
                {u.username!=='admin'&&<button onClick={()=>setDeleteTarget(u)} style={{...s.deleteBtn,flex:1,justifyContent:'center'}}>حذف</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editItem?'تعديل مستخدم':'إضافة مستخدم جديد'} onClose={closeModal}>
          <form onSubmit={handleSave}>
            <div className="form-grid-el" style={s.formGrid}>
              <FormField label="الاسم الكامل *"><input value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} placeholder="الاسم الكامل" style={s.input} required/></FormField>
              <FormField label={editItem?'اسم المستخدم':'اسم المستخدم *'}><input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="username" style={{...s.input,direction:'ltr',textAlign:'right'}} disabled={!!editItem} required={!editItem}/></FormField>
              <FormField label={editItem?'كلمة المرور الجديدة (اتركها فارغة)':'كلمة المرور *'}><input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" style={s.input} required={!editItem}/></FormField>
              <FormField label="الدور"><select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value,permissions:[]}))} style={s.input}><option value="viewer">مستخدم عادي</option><option value="admin">مدير (كل الصلاحيات)</option></select></FormField>
              {editItem&&<FormField label="الحالة"><select value={form.is_active?'1':'0'} onChange={e=>setForm(f=>({...f,is_active:e.target.value==='1'}))} style={s.input}><option value="1">نشط</option><option value="0">موقوف</option></select></FormField>}
            </div>
            {form.role!=='admin'&&(
              <div style={s.permsSection}>
                <div style={s.permsSectionHeader}><span style={s.permsSectionTitle}>🔐 الصلاحيات</span><span style={s.permsSectionSub}>اختر ما يستطيع هذا المستخدم الوصول إليه</span></div>
                <div style={s.permHint}>💡 اختيار <strong>إدارة</strong> أي قسم يمنح صلاحية <strong>العرض</strong> تلقائياً</div>
                {form.permissions.length>0&&(
                  <div style={s.selectedSummary}>
                    <span style={s.selectedLabel}>المحدد:</span>
                    {form.permissions.map(p=>{const grp=permGroup(p);return<span key={p} style={{...s.badge,fontSize:11,background:grp?.bg||'#F5F5F5',color:grp?.color||'#666'}}>{grp?.icon} {permLabel(p)}<button type="button" onClick={()=>togglePerm(p)} style={s.removeBadgeBtn}>✕</button></span>})}
                  </div>
                )}
                {PERMISSION_GROUPS.map(grp=>{
                  const allGroupOn=grp.permissions.every(p=>form.permissions.includes(p.key));
                  const someOn=grp.permissions.some(p=>form.permissions.includes(p.key));
                  return(
                    <div key={grp.group} style={s.permGroup}>
                      <div className="perm-group-header-el" style={s.permGroupHeader}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{...s.permGroupIcon,background:grp.bg,color:grp.color}}>{grp.icon}</div><div style={s.permGroupTitle}>{grp.group}</div></div>
                        <button type="button" onClick={()=>toggleGroup(grp.permissions)} style={{...s.selectAllBtn,...(allGroupOn?{background:grp.color,color:'#fff',borderColor:grp.color}:{})}}>{allGroupOn?'إلغاء الكل':someOn?'إكمال الكل':'تحديد الكل'}</button>
                      </div>
                      <div style={s.permItems}>
                        {grp.permissions.map(perm=>{
                          const active=form.permissions.includes(perm.key);
                          const forcedOn=perm.key.startsWith('view_')&&form.permissions.includes(perm.key.replace('view_','manage_'));
                          return(
                            <label key={perm.key} style={{...s.permItem,...(active?{borderColor:grp.color,background:`${grp.bg}88`}:{})}}>
                              <div style={{display:'flex',alignItems:'flex-start',gap:10,flex:1}}>
                                <input type="checkbox" checked={active} disabled={forcedOn} onChange={()=>!forcedOn&&togglePerm(perm.key)} style={{accentColor:grp.color,width:17,height:17,marginTop:2,cursor:forcedOn?'not-allowed':'pointer',flexShrink:0}}/>
                                <div>
                                  <div style={{fontSize:14,fontWeight:600,color:active?grp.color:'#1A1A1A'}}>{perm.label}{forcedOn&&<span style={{fontSize:11,color:grp.color,marginRight:6,fontWeight:400}}>(مضمّن تلقائياً)</span>}</div>
                                  <div style={{fontSize:12,color:'#999',marginTop:2}}>{perm.desc}</div>
                                </div>
                              </div>
                              {active&&<span style={{...s.checkMark,color:grp.color}}>✓</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {form.role==='admin'&&<div style={s.adminNotice}><span style={{fontSize:20}}>🛡️</span><div><div style={{fontWeight:700,color:'#CC1010',fontSize:14}}>صلاحيات المدير الكاملة</div><div style={{fontSize:12,color:'#888',marginTop:2}}>المدير يملك وصولاً كاملاً لجميع أقسام النظام تلقائياً</div></div></div>}
            <div style={s.modalFooter}>
              <button type="button" onClick={closeModal} style={s.cancelBtn}>إلغاء</button>
              <button type="submit" disabled={saving} style={s.submitBtn}>{saving?'جارٍ الحفظ...':editItem?'حفظ التعديلات':'إنشاء المستخدم'}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget&&(
        <Modal title="حذف المستخدم" onClose={()=>setDeleteTarget(null)} small>
          <div style={{textAlign:'center',padding:'10px 0 20px'}}>
            <div style={{fontSize:50,marginBottom:14}}>⚠️</div>
            <p style={{color:'#555',fontSize:15,marginBottom:8}}>هل تريد حذف المستخدم</p>
            <p style={{color:'#CC1010',fontWeight:800,fontSize:18}}>"{deleteTarget.full_name}"</p>
          </div>
          <div style={s.modalFooter}>
            <button onClick={()=>setDeleteTarget(null)} style={s.cancelBtn}>إلغاء</button>
            <button onClick={handleDelete} disabled={deleting} style={{...s.submitBtn,background:'#CC1010'}}>{deleting?'جارٍ الحذف...':'حذف'}</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus{outline:none;border-color:#CC1010!important;box-shadow:0 0 0 3px rgba(204,16,16,0.1)!important}
        tr:hover td{background:#FAFAFA}
        @media(max-width:640px){
          .page-header-el{flex-direction:column!important;align-items:stretch!important;gap:12px!important;}
          .add-btn-el{width:100%!important;justify-content:center!important;}
          .stats-row-el{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;}
          .table-wrap-el{display:none!important;}
          .usr-mobile-list{display:flex!important;}
          .form-grid-el{grid-template-columns:1fr!important;}
          .perm-group-header-el{flex-wrap:wrap!important;gap:8px!important;}
        }
        @media(min-width:641px){
          .usr-mobile-list{display:none!important;}
          .table-wrap-el{display:block!important;}
        }
      `}</style>
    </div>
  );
}
