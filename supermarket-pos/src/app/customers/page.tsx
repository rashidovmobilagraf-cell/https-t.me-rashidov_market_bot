'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Phone, Copy } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', telegramId: '', birthday: '' });
  const [botMessageModal, setBotMessageModal] = useState<{ isOpen: boolean, customerId: string, customerName: string, text: string }>({ isOpen: false, customerId: '', customerName: '', text: '' });
  const [userRole, setUserRole] = useState<string>('');
  const [editMode, setEditMode] = useState(false);

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

  useEffect(() => { 
    fetchCustomers(); 
    const u = localStorage.getItem('pos_user');
    if (u) {
      setUserRole(JSON.parse(u).role || '');
    }
    setEditMode(localStorage.getItem('pos_edit_mode') === 'true');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
    const method = editingId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Xatolik');
      }
      toast.success(editingId ? "Tahrirlandi" : "Mijoz qo'shildi");
      setIsModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham o'chirasizmi?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Xatolik');
      }
      toast.success("O'chirildi");
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      telegramId: c.telegramId || '',
      birthday: c.birthday ? new Date(c.birthday).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', address: '', telegramId: '', birthday: '' });
  };

  const copyPhones = () => {
    const phones = customers.filter(c => c.phone).map(c => c.phone).join(', ');
    navigator.clipboard.writeText(phones);
    toast.success("Raqamlar nusxalandi! (SMS uchun)");
  };

  const sendBotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: botMessageModal.customerId, message: botMessageModal.text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Xabar muvaffaqiyatli yuborildi!");
      setBotMessageModal({ isOpen: false, customerId: '', customerName: '', text: '' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Mijozlar Bazasi (CRM)</h1>
        <div className="flex gap-3">
          <button onClick={copyPhones} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
            <Copy size={20} /> Raqamlarni nusxalash
          </button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
            <Plus size={20} /> Mijoz qo'shish
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Mijoz</th>
              <th className="px-6 py-4 font-semibold">Telefon (SMS) & Telegram</th>
              <th className="px-6 py-4 font-semibold">Tug'ilgan kun</th>
              <th className="px-6 py-4 font-semibold">Manzil</th>
              <th className="px-6 py-4 font-semibold">Jami xarid</th>
              <th className="px-6 py-4 font-semibold">Joriy qarzi</th>
              <th className="px-6 py-4 font-semibold text-emerald-600">Keshbek (Bonus)</th>
              {userRole === 'ADMIN' && editMode && <th className="px-6 py-4 font-semibold text-right">Amallar</th>}
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
                  <td className="px-6 py-4 font-mono">
                    <p>{customer.phone || '-'}</p>
                    {customer.telegramId && <p className="text-xs text-blue-500 mt-1">TG: {customer.telegramId}</p>}
                  </td>
                  <td className="px-6 py-4">
                    {customer.birthday ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        new Date(customer.birthday).getMonth() === new Date().getMonth() && new Date(customer.birthday).getDate() === new Date().getDate()
                          ? 'bg-rose-100 text-rose-600 animate-pulse'
                          : 'text-slate-500 bg-slate-100'
                      }`}>
                        🎂 {new Date(customer.birthday).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-[150px] truncate" title={customer.address}>{customer.address || '-'}</td>
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
                  <td className="px-6 py-4 font-bold text-emerald-600 bg-emerald-50/30">
                    {customer.cashbackBalance > 0 ? `${customer.cashbackBalance.toLocaleString()} so'm` : '0'}
                  </td>
                  {userRole === 'ADMIN' && editMode && (
                    <td className="px-6 py-4 flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(customer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium">Tahrirlash</button>
                        <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium">O'chirish</button>
                      </div>
                      <div className="flex gap-2">
                        {customer.phone && (
                          <>
                            <a href={`tel:${customer.phone}`} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-medium" title="Qo'ng'iroq qilish">📞 Call</a>
                            <a href={`sms:${customer.phone}`} className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg text-xs font-medium" title="SMS yuborish">💬 SMS</a>
                          </>
                        )}
                        {customer.telegramChatId ? (
                          <button onClick={() => setBotMessageModal({ isOpen: true, customerId: customer.id, customerName: customer.name, text: '' })} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-medium flex items-center gap-1" title="Do'kon botidan xabar yozish">
                            🤖 Bot-SMS
                          </button>
                        ) : (
                          <a href={customer.telegramId ? `https://t.me/${customer.telegramId.replace('@', '')}` : '#'} target="_blank" className={`p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-medium flex items-center gap-1 ${!customer.telegramId && 'opacity-50 cursor-not-allowed'}`} title="Telegramdan yozish">
                            ✈️ TG
                          </a>
                        )}
                      </div>
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
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Mijozni tahrirlash' : 'Yangi mijoz'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ism / Familiya</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon raqam (SMS)</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="+998901234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telegram (Username/ID)</label>
                  <input type="text" value={formData.telegramId} onChange={e => setFormData({...formData, telegramId: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="@username" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yashash Manzili</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Urgut, Qoratepa mahalla 1-uy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tug'ilgan kuni 🎂 (Chegirma uchun)</label>
                <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-slate-700" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Bekor qilish</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {botMessageModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border-t-4 border-blue-500">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">🤖 Bot orqali xabar yuborish</h2>
            <p className="text-sm text-slate-500 mb-4">Mijoz: <b>{botMessageModal.customerName}</b></p>
            <form onSubmit={sendBotMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xabar matni:</label>
                <textarea required rows={4} value={botMessageModal.text} onChange={e => setBotMessageModal({...botMessageModal, text: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Assalomu alaykum! Sizga chegirma..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setBotMessageModal({ ...botMessageModal, isOpen: false })} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex justify-center items-center gap-2">
                  ✈️ Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
