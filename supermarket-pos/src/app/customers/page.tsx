'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Phone, Copy } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch {
      toast.error('Xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Xatolik');
      toast.success("Mijoz qo'shildi");
      setIsModalOpen(false);
      setFormData({ name: '', phone: '' });
      fetchCustomers();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const copyPhones = () => {
    const phones = customers.filter(c => c.phone).map(c => c.phone).join(', ');
    navigator.clipboard.writeText(phones);
    toast.success("Raqamlar nusxalandi! (SMS uchun)");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Mijozlar Bazasi (CRM)</h1>
        <div className="flex gap-3">
          <button onClick={copyPhones} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
            <Copy size={20} /> Raqamlarni nusxalash
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
            <Plus size={20} /> Mijoz qo'shish
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Mijoz</th>
              <th className="px-6 py-4 font-semibold">Telefon (SMS uchun)</th>
              <th className="px-6 py-4 font-semibold">Jami xaridlari summasi</th>
              <th className="px-6 py-4 font-semibold">Joriy qarzi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="text-center py-8">Yuklanmoqda...</td></tr> : 
              customers.map(customer => (
                <tr key={customer.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={16}/></div>
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 font-mono">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 font-semibold text-blue-600">
                    {customer.sales?.reduce((sum: number, s: any) => sum + s.totalAmount, 0).toLocaleString()} so'm
                  </td>
                  <td className="px-6 py-4">
                    {customer.balance > 0 ? (
                      <span className="text-red-600 font-bold">{customer.balance.toLocaleString()} so'm</span>
                    ) : (
                      <span className="text-slate-400">Yo'q</span>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Yangi mijoz</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ism / Familiya</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon raqam (SMS uchun)</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="+998901234567" />
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
