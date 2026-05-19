import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { NoAccess } from './NoAccess';

// ── Helpers ──────────────────────────────────────────────────────────────────
function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmt(n) { return Number(n || 0).toLocaleString('ar-EG'); }

const PARTY_EMPTY  = { name: '', type: 'debtor', phone: '', notes: '' };
const TX_EMPTY     = { party_id: '', type: 'debit', amount: '', date: todayDate(), description: '' };

// ── Main Component ────────────────────────────────────────────────────────────
export default function LedgerPage() {
  const { hasPermission, hasAnyPermission } = useAuth();

  if (!hasAnyPermission('view_ledger', 'manage_ledger')) {
    return <NoAccess page="الديون والدائنون" />;
  }
  const canManage = hasPermission('manage_ledger');

  // ── State ─────────────────────────────────────────────────────────────────
  const [tab,           setTab]           = useState('parties');   // 'parties' | 'transactions'
  const [parties,       setParties]       = useState([]);
  const [transactions,  setTransactions]  = useState([]);
  const [summary,       setSummary]       = useState({ totalDebtors:0, totalCreditors:0, net:0, debtorCount:0, creditorCount:0 });
  const [loading,       setLoading]       = useState(true);
  const [filterType,    setFilterType]    = useState('');          // '' | 'debtor' | 'creditor'
  const [filterParty,   setFilterParty]   = useState('');          // party_id for tx filter
  const [search,        setSearch]        = useState('');

  // Modals
  const [showPartyModal,  setShowPartyModal]  = useState(false);
  const [showTxModal,     setShowTxModal]     = useState(false);
  const [showTxList,      setShowTxList]      = useState(null);    // party object to view its txs
  const [editParty,       setEditParty]       = useState(null);
  const [editTx,          setEditTx]          = useState(null);
  const [deleteTarget,    setDeleteTarget]    = useState(null);    // { kind:'party'|'tx', item }
  const [partyForm,       setPartyForm]       = useState(PARTY_EMPTY);
  const [txForm,          setTxForm]          = useState(TX_EMPTY);
  const [saving,          setSaving]          = useState(false);
  const [deleting,        setDeleting]        = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (search)     params.search = search;

      const [pRes, tRes, sRes] = await Promise.all([
        axios.get('/api/ledger/parties', { params }),
        axios.get('/api/ledger/transactions', { params: filterParty ? { party_id: filterParty } : {} }),
        axios.get('/api/ledger/summary'),
      ]);
      setParties(pRes.data);
      setTransactions(tRes.data);
      setSummary(sRes.data);
    } catch { toast.error('فشل في تحميل البيانات'); }
    finally   { setLoading(false); }
  }, [filterType, filterParty, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Party CRUD ────────────────────────────────────────────────────────────
  const openAddParty = () => {
    setEditParty(null);
    setPartyForm(PARTY_EMPTY);
    setShowPartyModal(true);
  };
  const openEditParty = (p) => {
    setEditParty(p);
    setPartyForm({ name: p.name, type: p.type, phone: p.phone || '', notes: p.notes || '' });
    setShowPartyModal(true);
  };
  const closePartyModal = () => { setShowPartyModal(false); setEditParty(null); setPartyForm(PARTY_EMPTY); };

  const handleSaveParty = async (e) => {
    e.preventDefault();
    if (!partyForm.name.trim()) return toast.error('الاسم مطلوب');
    setSaving(true);
    try {
      if (editParty) {
        await axios.put(`/api/ledger/parties/${editParty.id}`, partyForm);
        toast.success('تم تعديل بيانات الطرف');
      } else {
        await axios.post('/api/ledger/parties', partyForm);
        toast.success('تم إضافة الطرف بنجاح');
      }
      closePartyModal(); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  // ── Transaction CRUD ──────────────────────────────────────────────────────
  const openAddTx = (party = null) => {
    setEditTx(null);
    setTxForm({ ...TX_EMPTY, party_id: party ? String(party.id) : '', date: todayDate() });
    setShowTxModal(true);
  };
  const openEditTx = (tx) => {
    setEditTx(tx);
    setTxForm({ party_id: String(tx.party_id), type: tx.type, amount: String(tx.amount), date: tx.date, description: tx.description || '' });
    setShowTxModal(true);
  };
  const closeTxModal = () => { setShowTxModal(false); setEditTx(null); setTxForm(TX_EMPTY); };

  const handleSaveTx = async (e) => {
    e.preventDefault();
    if (!txForm.party_id || !txForm.amount || !txForm.date) return toast.error('الطرف والمبلغ والتاريخ مطلوبة');
    if (isNaN(txForm.amount) || Number(txForm.amount) <= 0) return toast.error('المبلغ يجب أن يكون رقماً أكبر من صفر');
    setSaving(true);
    try {
      const payload = { ...txForm, amount: Number(txForm.amount), party_id: Number(txForm.party_id) };
      if (editTx) {
        await axios.put(`/api/ledger/transactions/${editTx.id}`, payload);
        toast.success('تم تعديل المعاملة');
      } else {
        await axios.post('/api/ledger/transactions', payload);
        toast.success(txForm.type === 'debit' ? 'تم تسجيل المديونية' : 'تم تسجيل السداد');
      }
      closeTxModal(); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'party') {
        await axios.delete(`/api/ledger/parties/${deleteTarget.item.id}`);
        toast.success('تم حذف الطرف');
      } else {
        await axios.delete(`/api/ledger/transactions/${deleteTarget.item.id}`);
        toast.success('تم حذف المعاملة');
      }
      setDeleteTarget(null); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل في الحذف'); }
    finally { setDeleting(false); }
  };

  // ── Filtered data ─────────────────────────────────────────────────────────
  const displayedParties = parties.filter(p =>
    !search || p.name.includes(search)
  );
  const selectedPartyTxs = showTxList
    ? transactions.filter(t => t.party_id === showTxList.id)
    : transactions;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>

      {/* ── Page Header ── */}
      <div className="page-header-el" style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>الديون والدائنون</h1>
          <p style={s.pageSubtitle}>تتبع المدينين والدائنين وتسجيل المدفوعات والرصيد الحالي</p>
        </div>
        {canManage && (
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <button onClick={() => openAddTx()} className="add-btn-el" style={{...s.addBtn, background:'#7B2FBE', boxShadow:'0 4px 14px rgba(123,47,190,0.25)'}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              معاملة جديدة
            </button>
            <button onClick={openAddParty} className="add-btn-el" style={s.addBtn}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              إضافة طرف
            </button>
          </div>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="stats-row-el" style={s.statsRow}>
        <StatCard icon="🔴" label="إجمالي ما يُدان لنا" value={summary.totalDebtors} sub={`${summary.debtorCount} مدين`} color="#CC1010"/>
        <StatCard icon="🔵" label="إجمالي ما ندين به" value={summary.totalCreditors} sub={`${summary.creditorCount} دائن`} color="#1A6EB0"/>
        <StatCard
          icon={summary.net >= 0 ? '✅' : '⚠️'}
          label="صافي المركز المالي"
          value={Math.abs(summary.net)}
          sub={summary.net >= 0 ? 'لصالحنا' : 'علينا'}
          color={summary.net >= 0 ? '#0A7A4E' : '#CC1010'}
          highlight
        />
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabs}>
        <button onClick={()=>setTab('parties')}      style={{...s.tab, ...(tab==='parties'      ? s.tabActive : {})}}>الأطراف</button>
        <button onClick={()=>setTab('transactions')} style={{...s.tab, ...(tab==='transactions' ? s.tabActive : {})}}>سجل المعاملات</button>
      </div>

      {/* ════════════════ PARTIES TAB ════════════════ */}
      {tab === 'parties' && (
        <>
          {/* Filters */}
          <div className="ca-filter-row" style={s.filterRow}>
            <div style={s.searchWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2" style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="البحث بالاسم..." value={search} onChange={e=>setSearch(e.target.value)} style={s.searchInput}/>
            </div>
            <TypeFilter value={filterType} onChange={setFilterType}/>
          </div>

          {/* Desktop table */}
          <div className="ca-table-wrap table-wrap-el" style={s.tableWrap}>
            {loading ? (
              <Loading/>
            ) : displayedParties.length === 0 ? (
              <Empty msg="لا توجد أطراف مسجلة" onAdd={canManage ? openAddParty : null} addLabel="إضافة أول طرف"/>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {['#','الاسم','النوع','الهاتف','الرصيد الحالي','الحالة',canManage?'إجراءات':''].filter(Boolean).map(h=><th key={h} style={s.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {displayedParties.map((p, idx) => (
                    <tr key={p.id} style={s.tr}>
                      <td style={{...s.td, ...s.tdNum}}>{idx+1}</td>
                      <td style={s.td}>
                        <div style={{fontWeight:700, fontSize:15}}>{p.name}</div>
                        {p.notes && <div style={{fontSize:12, color:'#999', marginTop:2}}>{p.notes}</div>}
                      </td>
                      <td style={s.td}>
                        <TypeBadge type={p.type}/>
                      </td>
                      <td style={{...s.td, color:'#767676', direction:'ltr', textAlign:'center'}}>{p.phone || '—'}</td>
                      <td style={s.td}>
                        <BalanceBadge balance={p.balance} type={p.type}/>
                      </td>
                      <td style={s.td}>
                        <span style={{...s.badge, ...(p.balance===0 ? {background:'#E8F8F0',color:'#0A7A4E'} : {background:'#FFF5F5',color:'#CC1010'})}}>
                          {p.balance === 0 ? 'مُسوَّى ✓' : 'قيد السداد'}
                        </span>
                      </td>
                      {canManage && (
                        <td style={s.td}>
                          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                            <button onClick={()=>{ setShowTxList(p); setTab('transactions'); setFilterParty(String(p.id)); }} style={s.viewBtn}>سجل</button>
                            <button onClick={()=>openAddTx(p)} style={s.payBtn}>
                              {p.type==='debtor' ? 'سداد' : 'دفع'}
                            </button>
                            <button onClick={()=>openEditParty(p)} style={s.editBtn}>تعديل</button>
                            <button onClick={()=>setDeleteTarget({kind:'party', item:p})} style={s.deleteBtn}>حذف</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile cards */}
          {!loading && displayedParties.length > 0 && (
            <div className="ca-mobile-list" style={{display:'none', flexDirection:'column', gap:12}}>
              {displayedParties.map(p => (
                <div key={p.id} style={s.mobileCard}>
                  <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10}}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontWeight:700, fontSize:15, color:'#1A1A1A'}}>{p.name}</div>
                      {p.phone && <div style={{fontSize:12, color:'#999', marginTop:2, direction:'ltr'}}>{p.phone}</div>}
                      {p.notes && <div style={{fontSize:12, color:'#B0B0B0', marginTop:2}}>{p.notes}</div>}
                    </div>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0}}>
                      <TypeBadge type={p.type}/>
                      <BalanceBadge balance={p.balance} type={p.type}/>
                    </div>
                  </div>
                  {canManage && (
                    <div style={{display:'flex', gap:8, flexWrap:'wrap', borderTop:'1px solid #F0F0F0', paddingTop:10}}>
                      <button onClick={()=>{ setShowTxList(p); setTab('transactions'); setFilterParty(String(p.id)); }} style={{...s.viewBtn, flex:1, justifyContent:'center'}}>سجل المعاملات</button>
                      <button onClick={()=>openAddTx(p)} style={{...s.payBtn, flex:1, justifyContent:'center'}}>{p.type==='debtor'?'تسجيل سداد':'تسجيل دفع'}</button>
                      <button onClick={()=>openEditParty(p)} style={s.editBtn}>تعديل</button>
                      <button onClick={()=>setDeleteTarget({kind:'party',item:p})} style={s.deleteBtn}>حذف</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════ TRANSACTIONS TAB ════════════════ */}
      {tab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="ca-filter-row" style={s.filterRow}>
            <select value={filterParty} onChange={e=>{ setFilterParty(e.target.value); setShowTxList(null); }} style={s.filterSelect}>
              <option value="">كل الأطراف</option>
              {parties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {filterParty && (
              <button onClick={()=>{ setFilterParty(''); setShowTxList(null); }} style={s.clearBtn}>عرض الكل</button>
            )}
          </div>

          {/* Desktop table */}
          <div className="ca-table-wrap table-wrap-el" style={s.tableWrap}>
            {loading ? (
              <Loading/>
            ) : selectedPartyTxs.length === 0 ? (
              <Empty msg="لا توجد معاملات مسجلة" onAdd={canManage ? ()=>openAddTx() : null} addLabel="تسجيل معاملة"/>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {['#','الطرف','نوع المعاملة','المبلغ','التاريخ','البيان',canManage?'إجراءات':''].filter(Boolean).map(h=><th key={h} style={s.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {selectedPartyTxs.map((tx, idx) => (
                    <tr key={tx.id} style={s.tr}>
                      <td style={{...s.td, ...s.tdNum}}>{idx+1}</td>
                      <td style={s.td}>
                        <div style={{fontWeight:600}}>{tx.party_name}</div>
                        <TypeBadge type={tx.party_type} small/>
                      </td>
                      <td style={s.td}><TxBadge type={tx.type}/></td>
                      <td style={s.td}>
                        <span style={{fontWeight:800, fontSize:15, color: tx.type==='debit' ? '#CC1010' : '#0A7A4E'}}>
                          {tx.type === 'debit' ? '+' : '−'} {fmt(tx.amount)} ج.م
                        </span>
                      </td>
                      <td style={{...s.td, fontSize:13, color:'#767676', direction:'ltr', textAlign:'center'}}>{tx.date}</td>
                      <td style={{...s.td, color:'#767676', fontSize:13}}>{tx.description || <span style={{color:'#C0C0C0'}}>—</span>}</td>
                      {canManage && (
                        <td style={s.td}>
                          <div style={{display:'flex', gap:6}}>
                            <button onClick={()=>openEditTx(tx)} style={s.editBtn}>تعديل</button>
                            <button onClick={()=>setDeleteTarget({kind:'tx', item:tx})} style={s.deleteBtn}>حذف</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile cards */}
          {!loading && selectedPartyTxs.length > 0 && (
            <div className="ca-mobile-list" style={{display:'none', flexDirection:'column', gap:10}}>
              {selectedPartyTxs.map(tx => (
                <div key={tx.id} style={s.mobileCard}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:10}}>
                    <div>
                      <div style={{fontWeight:700, fontSize:14}}>{tx.party_name}</div>
                      <div style={{marginTop:4, display:'flex', gap:6, alignItems:'center'}}>
                        <TxBadge type={tx.type}/>
                        <TypeBadge type={tx.party_type} small/>
                      </div>
                    </div>
                    <span style={{fontWeight:800, fontSize:16, color: tx.type==='debit' ? '#CC1010' : '#0A7A4E', whiteSpace:'nowrap'}}>
                      {tx.type === 'debit' ? '+' : '−'} {fmt(tx.amount)} ج.م
                    </span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #F0F0F0', paddingTop:8}}>
                    <span style={{fontSize:12, color:'#999', direction:'ltr'}}>{tx.date}</span>
                    {tx.description && <span style={{fontSize:12, color:'#767676'}}>{tx.description}</span>}
                  </div>
                  {canManage && (
                    <div style={{display:'flex', gap:8}}>
                      <button onClick={()=>openEditTx(tx)} style={{...s.editBtn, flex:1, justifyContent:'center'}}>تعديل</button>
                      <button onClick={()=>setDeleteTarget({kind:'tx',item:tx})} style={{...s.deleteBtn, flex:1, justifyContent:'center'}}>حذف</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════ PARTY MODAL ════════ */}
      {showPartyModal && (
        <Modal title={editParty ? 'تعديل بيانات الطرف' : 'إضافة طرف جديد'} onClose={closePartyModal}>
          <form onSubmit={handleSaveParty}>
            <div className="form-grid-el" style={s.formGrid}>
              <Field label="الاسم *" full>
                <input value={partyForm.name} onChange={e=>setPartyForm(f=>({...f,name:e.target.value}))} placeholder="اسم الشخص أو الشركة" style={s.input} required/>
              </Field>
              <Field label="النوع *">
                <select value={partyForm.type} onChange={e=>setPartyForm(f=>({...f,type:e.target.value}))} style={s.input} disabled={!!editParty}>
                  <option value="debtor">مدين — يدين لنا بمال</option>
                  <option value="creditor">دائن — نحن ندين له بمال</option>
                </select>
              </Field>
              <Field label="رقم الهاتف">
                <input value={partyForm.phone} onChange={e=>setPartyForm(f=>({...f,phone:e.target.value}))} placeholder="01XXXXXXXXX" style={s.input}/>
              </Field>
            </div>
            <Field label="ملاحظات">
              <input value={partyForm.notes} onChange={e=>setPartyForm(f=>({...f,notes:e.target.value}))} placeholder="أي ملاحظات إضافية..." style={{...s.input, marginBottom:24}}/>
            </Field>
            <div style={s.modalFooter}>
              <button type="button" onClick={closePartyModal} style={s.cancelBtn}>إلغاء</button>
              <button type="submit" disabled={saving} style={s.submitBtn}>{saving ? 'جارٍ الحفظ...' : editParty ? 'حفظ التعديلات' : 'إضافة الطرف'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ════════ TRANSACTION MODAL ════════ */}
      {showTxModal && (
        <Modal title={editTx ? 'تعديل المعاملة' : 'تسجيل معاملة جديدة'} onClose={closeTxModal}>
          <form onSubmit={handleSaveTx}>
            {/* Type selector — big radio buttons */}
            {!editTx && (
              <div style={s.txTypeRow}>
                <button type="button" onClick={()=>setTxForm(f=>({...f,type:'debit'}))}
                  style={{...s.txTypeBtn, ...(txForm.type==='debit' ? s.txTypeBtnDebit : {})}}>
                  <span style={{fontSize:22}}>📋</span>
                  <span style={{fontWeight:700, fontSize:14}}>مديونية</span>
                  <span style={{fontSize:12, color: txForm.type==='debit' ? '#fff' : '#999'}}>تسجيل دين جديد</span>
                </button>
                <button type="button" onClick={()=>setTxForm(f=>({...f,type:'payment'}))}
                  style={{...s.txTypeBtn, ...(txForm.type==='payment' ? s.txTypeBtnPayment : {})}}>
                  <span style={{fontSize:22}}>✅</span>
                  <span style={{fontWeight:700, fontSize:14}}>سداد</span>
                  <span style={{fontSize:12, color: txForm.type==='payment' ? '#fff' : '#999'}}>تسجيل دفعة</span>
                </button>
              </div>
            )}

            <div className="form-grid-el" style={s.formGrid}>
              <Field label="الطرف *" full={!editTx}>
                <select value={txForm.party_id} onChange={e=>setTxForm(f=>({...f,party_id:e.target.value}))} style={s.input} required disabled={!!editTx}>
                  <option value="">اختر الطرف</option>
                  {parties.map(p=><option key={p.id} value={p.id}>{p.name} ({p.type==='debtor'?'مدين':'دائن'}) — رصيد: {fmt(p.balance)} ج.م</option>)}
                </select>
              </Field>
              <Field label="المبلغ (ج.م) *">
                <input type="number" min="0.01" step="0.01" value={txForm.amount} onChange={e=>setTxForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={s.input} required/>
              </Field>
              <Field label="التاريخ *">
                <input type="date" value={txForm.date} onChange={e=>setTxForm(f=>({...f,date:e.target.value}))} style={s.input} required/>
              </Field>
            </div>

            <Field label="البيان / الوصف">
              <input value={txForm.description} onChange={e=>setTxForm(f=>({...f,description:e.target.value}))} placeholder="مثال: دفعة أولى، بضاعة، خدمات..." style={{...s.input, marginBottom:20}}/>
            </Field>

            {/* Live balance preview */}
            {txForm.party_id && txForm.amount && Number(txForm.amount) > 0 && (() => {
              const party = parties.find(p => String(p.id) === String(txForm.party_id));
              if (!party) return null;
              const newBalance = txForm.type === 'debit'
                ? party.balance + Number(txForm.amount)
                : party.balance - Number(txForm.amount);
              return (
                <div style={s.previewBox}>
                  <div style={s.previewTitle}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7B2FBE" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    تأثير المعاملة على الرصيد
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #F0F0F0'}}>
                    <span style={{fontSize:13, color:'#555'}}>الرصيد الحالي</span>
                    <span style={{fontWeight:700, color:'#555'}}>{fmt(party.balance)} ج.م</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #F0F0F0'}}>
                    <span style={{fontSize:13, color:'#555'}}>{txForm.type==='debit' ? 'إضافة مديونية' : 'سداد'}</span>
                    <span style={{fontWeight:700, color: txForm.type==='debit' ? '#CC1010' : '#0A7A4E'}}>
                      {txForm.type==='debit' ? '+' : '−'} {fmt(txForm.amount)} ج.م
                    </span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0 2px', borderTop:'2px solid #E0E0E0', marginTop:4}}>
                    <span style={{fontWeight:700, fontSize:14}}>الرصيد بعد المعاملة</span>
                    <span style={{fontWeight:800, fontSize:18, color: newBalance <= 0 ? '#0A7A4E' : '#CC1010'}}>
                      {fmt(Math.abs(newBalance))} ج.م {newBalance <= 0 ? '✓ مُسوَّى' : ''}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div style={s.modalFooter}>
              <button type="button" onClick={closeTxModal} style={s.cancelBtn}>إلغاء</button>
              <button type="submit" disabled={saving} style={{...s.submitBtn, background: txForm.type==='payment' ? '#0A7A4E' : '#CC1010'}}>
                {saving ? 'جارٍ الحفظ...' : editTx ? 'حفظ التعديلات' : txForm.type==='debit' ? 'تسجيل المديونية' : 'تسجيل السداد'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ════════ DELETE CONFIRM ════════ */}
      {deleteTarget && (
        <Modal title="تأكيد الحذف" onClose={()=>setDeleteTarget(null)} small>
          <div style={{textAlign:'center', padding:'8px 0 16px'}}>
            <div style={{fontSize:48, marginBottom:12}}>⚠️</div>
            {deleteTarget.kind === 'party' ? (
              <>
                <p style={{color:'#4A4A4A', fontSize:15, marginBottom:6}}>هل تريد حذف الطرف</p>
                <p style={{color:'#CC1010', fontWeight:700, fontSize:17, marginBottom:4}}>{deleteTarget.item.name}</p>
                <p style={{color:'#999', fontSize:13}}>يجب أن يكون رصيده صفراً قبل الحذف</p>
              </>
            ) : (
              <>
                <p style={{color:'#4A4A4A', fontSize:15, marginBottom:6}}>هل تريد حذف هذه المعاملة؟</p>
                <p style={{color:'#CC1010', fontWeight:700, fontSize:16, marginBottom:4}}>
                  {deleteTarget.item.type==='debit' ? 'مديونية' : 'سداد'} — {fmt(deleteTarget.item.amount)} ج.م
                </p>
                <p style={{color:'#999', fontSize:13}}>سيتأثر الرصيد الحالي للطرف</p>
              </>
            )}
          </div>
          <div style={s.modalFooter}>
            <button onClick={()=>setDeleteTarget(null)} style={s.cancelBtn}>إلغاء</button>
            <button onClick={handleDelete} disabled={deleting} style={{...s.submitBtn, background:'#CC1010'}}>
              {deleting ? 'جارٍ الحذف...' : 'نعم، احذف'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus{outline:none;border-color:#7B2FBE!important;box-shadow:0 0 0 3px rgba(123,47,190,0.12)!important}
        tr:hover td{background:#FAFAFA}
        @media(max-width:640px){
          .ca-table-wrap{display:none!important;}
          .ca-mobile-list{display:flex!important;}
          .ca-filter-row{flex-wrap:wrap!important;gap:8px!important;}
          .form-grid-el{grid-template-columns:1fr!important;}
          .page-header-el{flex-direction:column!important;align-items:stretch!important;gap:12px!important;}
          .add-btn-el{width:100%!important;justify-content:center!important;}
          .stats-row-el{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;}
        }
        @media(min-width:641px){
          .ca-mobile-list{display:none!important;}
          .ca-table-wrap{display:block!important;}
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, highlight }) {
  return (
    <div style={{background: highlight ? '#1A1A1A' : '#fff', border:`1px solid ${highlight ? '#1A1A1A' : '#EBEBEB'}`, borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'center', gap:14, flex:1, minWidth:0}}>
      <div style={{width:48, height:48, borderRadius:12, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0}}>{icon}</div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:20, fontWeight:800, color: highlight ? '#fff' : color, lineHeight:1.2}}>{fmt(value)} <span style={{fontSize:13, fontWeight:600}}>ج.م</span></div>
        <div style={{fontSize:12, color: highlight ? '#aaa' : '#999', marginTop:2, fontWeight:500}}>{label}</div>
        {sub && <div style={{fontSize:11, color: highlight ? '#888' : '#B0B0B0', marginTop:1}}>{sub}</div>}
      </div>
    </div>
  );
}

function TypeBadge({ type, small }) {
  const isDebtor = type === 'debtor';
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:4, padding: small ? '2px 8px' : '4px 12px', borderRadius:99, fontSize: small ? 11 : 13, fontWeight:600, background: isDebtor ? '#FFF5F5' : '#EBF5FF', color: isDebtor ? '#CC1010' : '#1A6EB0'}}>
      {isDebtor ? '🔴 مدين' : '🔵 دائن'}
    </span>
  );
}

function TxBadge({ type }) {
  const isDebit = type === 'debit';
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:99, fontSize:13, fontWeight:600, background: isDebit ? '#FFF5F5' : '#E8F8F0', color: isDebit ? '#CC1010' : '#0A7A4E'}}>
      {isDebit ? '📋 مديونية' : '✅ سداد'}
    </span>
  );
}

function BalanceBadge({ balance, type }) {
  const settled = balance <= 0;
  return (
    <span style={{display:'inline-flex', padding:'5px 14px', borderRadius:99, fontSize:13, fontWeight:800, background: settled ? 'rgba(10,122,78,0.1)' : 'rgba(204,16,16,0.08)', color: settled ? '#0A7A4E' : '#CC1010', whiteSpace:'nowrap'}}>
      {settled ? '✓ مُسوَّى' : `${fmt(balance)} ج.م`}
    </span>
  );
}

function TypeFilter({ value, onChange }) {
  return (
    <div style={{display:'flex', gap:6}}>
      {[['','الكل'],['debtor','المدينون'],['creditor','الدائنون']].map(([v, label]) => (
        <button key={v} onClick={()=>onChange(v)} style={{padding:'8px 16px', borderRadius:20, border:`1.5px solid ${value===v ? '#7B2FBE' : '#E0E0E0'}`, background: value===v ? '#7B2FBE' : '#fff', color: value===v ? '#fff' : '#555', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s'}}>{label}</button>
      ))}
    </div>
  );
}

function Loading() {
  return <div style={{textAlign:'center', padding:'56px 20px'}}><div style={{width:36, height:36, border:'3px solid #F0F0F0', borderTopColor:'#7B2FBE', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 14px'}}/><p style={{color:'#999'}}>جارٍ التحميل...</p></div>;
}

function Empty({ msg, onAdd, addLabel }) {
  return (
    <div style={{textAlign:'center', padding:'56px 20px'}}>
      <div style={{fontSize:48, marginBottom:12}}>⚖️</div>
      <p style={{color:'#999', fontSize:15, marginBottom:16}}>{msg}</p>
      {onAdd && <button onClick={onAdd} style={{padding:'11px 26px', background:'#7B2FBE', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer'}}>{addLabel}</button>}
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6, ...(full ? {gridColumn:'1/-1'} : {})}}>
      <label style={{fontSize:13, fontWeight:600, color:'#1A1A1A'}}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, small }) {
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
      <div className="modal-inner-el" style={{background:'#fff', borderRadius:18, width:'100%', maxWidth: small ? 440 : 680, maxHeight:'92vh', overflowY:'auto', animation:'fadeIn 0.25s ease', boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 28px', borderBottom:'1px solid #F0F0F0', position:'sticky', top:0, background:'#fff', zIndex:1}}>
          <h3 style={{fontSize:18, fontWeight:800, color:'#1A1A1A', margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:'none', border:'none', color:'#999', cursor:'pointer', display:'flex', padding:4}}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{padding:'24px 28px 28px'}}>{children}</div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  pageHeader:   { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:16 },
  pageTitle:    { fontSize:26, fontWeight:800, color:'#1A1A1A', margin:0 },
  pageSubtitle: { fontSize:15, color:'#999', marginTop:4, fontWeight:500 },
  addBtn:       { display:'flex', alignItems:'center', gap:8, padding:'12px 22px', background:'#CC1010', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(204,16,16,0.25)', flexShrink:0, whiteSpace:'nowrap' },
  statsRow:     { display:'flex', gap:14, marginBottom:22, flexWrap:'wrap' },
  tabs:         { display:'flex', gap:0, marginBottom:20, borderBottom:'2px solid #EBEBEB' },
  tab:          { padding:'12px 24px', fontSize:15, fontWeight:600, color:'#999', background:'none', border:'none', cursor:'pointer', borderBottom:'2px solid transparent', marginBottom:'-2px', transition:'all 0.18s' },
  tabActive:    { color:'#7B2FBE', borderBottomColor:'#7B2FBE', fontWeight:700 },
  filterRow:    { display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' },
  searchWrap:   { position:'relative', flex:1, minWidth:180 },
  searchInput:  { width:'100%', padding:'10px 44px 10px 14px', fontSize:14, fontFamily:'Cairo,sans-serif', border:'1.5px solid #E8E8E8', borderRadius:9, background:'#fff', color:'#1A1A1A', direction:'rtl' },
  filterSelect: { padding:'10px 14px', fontSize:14, fontFamily:'Cairo,sans-serif', border:'1.5px solid #E8E8E8', borderRadius:9, background:'#fff', color:'#1A1A1A', direction:'rtl', minWidth:180 },
  clearBtn:     { padding:'10px 18px', border:'1.5px solid #E8E8E8', borderRadius:9, background:'#fff', color:'#767676', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },
  tableWrap:    { background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', overflow:'auto' },
  table:        { width:'100%', borderCollapse:'collapse', minWidth:640 },
  th:           { padding:'13px 16px', textAlign:'right', fontSize:13, fontWeight:700, color:'#B0B0B0', background:'#FAFAFA', borderBottom:'1px solid #EBEBEB', whiteSpace:'nowrap' },
  tr:           { transition:'background 0.15s' },
  td:           { padding:'13px 16px', fontSize:14, color:'#2D2D2D', borderBottom:'1px solid #F5F5F5', verticalAlign:'middle' },
  tdNum:        { color:'#C0C0C0', fontSize:12, width:36, textAlign:'center' },
  badge:        { display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:99, fontSize:12, fontWeight:600 },
  mobileCard:   { background:'#fff', border:'1px solid #EBEBEB', borderRadius:12, padding:'14px', display:'flex', flexDirection:'column', gap:10 },
  editBtn:      { display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background:'#F0F7FF', color:'#1A6EB0', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' },
  deleteBtn:    { display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background:'#FFF5F5', color:'#CC1010', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' },
  viewBtn:      { display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background:'#F3E8FF', color:'#7B2FBE', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' },
  payBtn:       { display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background:'#E8F8F0', color:'#0A7A4E', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' },
  formGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 20px', marginBottom:18 },
  input:        { padding:'11px 14px', fontSize:15, fontFamily:'Cairo,sans-serif', border:'1.5px solid #E8E8E8', borderRadius:9, background:'#FAFAFA', color:'#1A1A1A', direction:'rtl', width:'100%', transition:'all 0.2s' },
  txTypeRow:    { display:'flex', gap:12, marginBottom:20 },
  txTypeBtn:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'16px 12px', border:'2px solid #E0E0E0', borderRadius:12, background:'#FAFAFA', cursor:'pointer', transition:'all 0.2s' },
  txTypeBtnDebit:    { background:'#CC1010', borderColor:'#CC1010', color:'#fff' },
  txTypeBtnPayment:  { background:'#0A7A4E', borderColor:'#0A7A4E', color:'#fff' },
  previewBox:   { background:'#FAF5FF', border:'1.5px solid #E9D5FF', borderRadius:12, padding:'14px 18px', marginBottom:20 },
  previewTitle: { display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, color:'#7B2FBE', marginBottom:10 },
  modalFooter:  { display:'flex', gap:10, justifyContent:'flex-end' },
  cancelBtn:    { padding:'11px 24px', border:'1.5px solid #E0E0E0', borderRadius:9, background:'#fff', color:'#4A4A4A', fontSize:15, fontWeight:600, cursor:'pointer' },
  submitBtn:    { padding:'11px 28px', border:'none', borderRadius:9, background:'#CC1010', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(204,16,16,0.2)' },
};
