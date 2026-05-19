import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PARTY_EMPTY = { name: '', type: 'debtor', phone: '', notes: '' };
const TX_EMPTY    = { party_id: '', type: 'debit', amount: '', date: todayDate(), description: '' };

export function useLedger() {
  const [tab,          setTab]          = useState('parties');
  const [parties,      setParties]      = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary,      setSummary]      = useState({ totalDebtors: 0, totalCreditors: 0, net: 0, debtorCount: 0, creditorCount: 0 });
  const [loading,      setLoading]      = useState(true);
  const [filterType,   setFilterType]   = useState('');
  const [filterParty,  setFilterParty]  = useState('');
  const [search,       setSearch]       = useState('');

  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showTxModal,    setShowTxModal]    = useState(false);
  const [showTxList,     setShowTxList]     = useState(null);
  const [editParty,      setEditParty]      = useState(null);
  const [editTx,         setEditTx]         = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [partyForm,      setPartyForm]      = useState(PARTY_EMPTY);
  const [txForm,         setTxForm]         = useState(TX_EMPTY);
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type   = filterType;
      if (search)     params.search = search;
      const [pRes, tRes, sRes] = await Promise.all([
        axios.get('/api/ledger/parties',      { params }),
        axios.get('/api/ledger/transactions', { params: filterParty ? { party_id: filterParty } : {} }),
        axios.get('/api/ledger/summary'),
      ]);
      setParties(pRes.data); setTransactions(tRes.data); setSummary(sRes.data);
    } catch { toast.error('فشل في تحميل البيانات'); }
    finally { setLoading(false); }
  }, [filterType, filterParty, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Party CRUD
  const openAddParty  = () => { setEditParty(null); setPartyForm(PARTY_EMPTY); setShowPartyModal(true); };
  const openEditParty = (p) => { setEditParty(p); setPartyForm({ name: p.name, type: p.type, phone: p.phone || '', notes: p.notes || '' }); setShowPartyModal(true); };
  const closePartyModal = () => { setShowPartyModal(false); setEditParty(null); setPartyForm(PARTY_EMPTY); };

  const handleSaveParty = async (e) => {
    e.preventDefault();
    if (!partyForm.name.trim()) return toast.error('الاسم مطلوب');
    setSaving(true);
    try {
      if (editParty) { await axios.put(`/api/ledger/parties/${editParty.id}`, partyForm); toast.success('تم تعديل بيانات الطرف'); }
      else { await axios.post('/api/ledger/parties', partyForm); toast.success('تم إضافة الطرف بنجاح'); }
      closePartyModal(); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  // Transaction CRUD
  const openAddTx   = (party = null) => { setEditTx(null); setTxForm({ ...TX_EMPTY, party_id: party ? String(party.id) : '', date: todayDate() }); setShowTxModal(true); };
  const openEditTx  = (tx) => { setEditTx(tx); setTxForm({ party_id: String(tx.party_id), type: tx.type, amount: String(tx.amount), date: tx.date, description: tx.description || '' }); setShowTxModal(true); };
  const closeTxModal = () => { setShowTxModal(false); setEditTx(null); setTxForm(TX_EMPTY); };

  const handleSaveTx = async (e) => {
    e.preventDefault();
    if (!txForm.party_id || !txForm.amount || !txForm.date) return toast.error('الطرف والمبلغ والتاريخ مطلوبة');
    if (isNaN(txForm.amount) || Number(txForm.amount) <= 0) return toast.error('المبلغ يجب أن يكون رقماً أكبر من صفر');
    setSaving(true);
    try {
      const payload = { ...txForm, amount: Number(txForm.amount), party_id: Number(txForm.party_id) };
      if (editTx) { await axios.put(`/api/ledger/transactions/${editTx.id}`, payload); toast.success('تم تعديل المعاملة'); }
      else { await axios.post('/api/ledger/transactions', payload); toast.success(txForm.type === 'debit' ? 'تم تسجيل المديونية' : 'تم تسجيل السداد'); }
      closeTxModal(); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'party') { await axios.delete(`/api/ledger/parties/${deleteTarget.item.id}`); toast.success('تم حذف الطرف'); }
      else { await axios.delete(`/api/ledger/transactions/${deleteTarget.item.id}`); toast.success('تم حذف المعاملة'); }
      setDeleteTarget(null); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل في الحذف'); }
    finally { setDeleting(false); }
  };

  const displayedParties  = parties.filter(p => !search || p.name.includes(search));
  const selectedPartyTxs  = showTxList ? transactions.filter(t => t.party_id === showTxList.id) : transactions;

  return { tab, setTab, parties, transactions, summary, loading, filterType, setFilterType, filterParty, setFilterParty, search, setSearch, showPartyModal, showTxModal, showTxList, setShowTxList, editParty, editTx, deleteTarget, setDeleteTarget, partyForm, setPartyForm, txForm, setTxForm, saving, deleting, displayedParties, selectedPartyTxs, openAddParty, openEditParty, closePartyModal, handleSaveParty, openAddTx, openEditTx, closeTxModal, handleSaveTx, handleDelete };
}
