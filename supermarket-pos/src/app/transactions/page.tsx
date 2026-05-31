'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Wallet, Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ type: 'EXPENSE', amount: '', description: '' });
  const [userRole, setUserRole] = useState<string>('');
  const [editMode, setEditMode] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
    } catch {
      toast.error('Xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTransactions(); 
    const u = localStorage.getItem('pos_user');
    if (u) {
      setUserRole(JSON.parse(u).role || '');
    }
    setEditMode(localStorage.getItem('pos_edit_mode') === 'true');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
    const method = editingId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Xatolik');
      toast.success(editingId ? "Tahrirlandi" : "Saqlandi");
      setIsModalOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham o'chirasizmi?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("O'chirishda xatolik");
      toast.success("O'chirildi");
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEdit = (tx: any) => {
    setEditingId(tx.id);
    setFormData({
      type: tx.type,
      amount: String(tx.amount),
      description: tx.description || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ type: 'EXPENSE', amount: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Kirim - Chiqim</h1>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
          <Plus size={20} /> Amaliyot qo'shish
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Sana</th>
              <th className="px-6 py-4 font-semibold">Turi</th>
              <th className="px-6 py-4 font-semibold">Summa</th>
              <th className="px-6 py-4 font-semibold">Izoh (Mijoz)</th>
              {userRole === 'ADMIN' && editMode && <th className="px-6 py-4 font-semibold text-right">Amallar</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="text-center py-8">Yuklanmoqda...</td></tr> : 
              transactions.map(tx => (
                <tr key={tx.id} className="border-b border-slate-50">
                  <td className="px-6 py-4">{format(new Date(tx.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                  <td className="px-6 py-4">
                    {tx.type === 'INCOME' && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md flex w-fit items-center gap-1"><ArrowUpRight size={14}/> Kirim</span>}
                    {tx.type === 'INVESTMENT' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md flex w-fit items-center gap-1"><ArrowUpRight size={14}/> Kiritilgan pul</span>}
                    {tx.type === 'DEBT_REPAYMENT' && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md flex w-fit items-center gap-1"><ArrowUpRight size={14}/> Qarz to'lovi</span>}
                    {tx.type === 'EXPENSE' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md flex w-fit items-center gap-1"><ArrowDownRight size={14}/> Xarajat</span>}
                    {tx.type === 'PERSONAL' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md flex w-fit items-center gap-1"><ArrowDownRight size={14}/> Shaxsiy</span>}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{tx.amount.toLocaleString()} so'm</td>
                  <td className="px-6 py-4">{tx.description} {tx.customer ? `(${tx.customer.name})` : ''}</td>
                  {userRole === 'ADMIN' && editMode && (
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => openEdit(tx)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">Tahrirlash</button>
                      <button onClick={() => handleDelete(tx.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">O'chirish</button>
                    </td>
                  )}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Amaliyotni tahrirlash' : 'Yangi amaliyot'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amaliyot turi</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg">
                  <option value="INCOME">Oddiy Kirim</option>
                  <option value="INVESTMENT">Do'konga pul kiritish (Investitsiya)</option>
                  <option value="EXPENSE">Xarajat (Soliq, Arenga, Oylik)</option>
                  <option value="PERSONAL">Uyga / Shaxsiy pul yechish</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Summa</label>
                <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Izoh</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Bekor qilish</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
