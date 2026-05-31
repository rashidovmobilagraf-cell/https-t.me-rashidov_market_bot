'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Trash2, Store } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState("RASHIDOV_MARKET.no1_POST");
  const [editMode, setEditMode] = useState(false);

  // Load initial settings
  if (typeof window !== 'undefined' && !loading && !storeName.includes('init')) {
    const isEdit = localStorage.getItem('pos_edit_mode') === 'true';
    if (editMode !== isEdit) setEditMode(isEdit);
  }

  const handleReset = async () => {
    const confirmation = prompt("OGOHLANTIRISH!\nBu amal barcha tovarlarni, savdolarni, mijozlar va qarzlarni o'chirib yuboradi. Buni ortga qaytarib bo'lmaydi.\n\nTasdiqlash uchun 'RESET' deb yozing:");
    if (confirmation !== 'RESET') {
      toast.error("Bekor qilindi yoki noto'g'ri so'z kiritildi.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Xatolik');
      toast.success("Barcha ma'lumotlar tozalandi! Tizim yangidek bo'ldi.");
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      toast.error("Tozalashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Sozlamalar</h1>

      {/* General Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <Store size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Umumiy sozlamalar</h2>
            <p className="text-sm text-slate-500">Do'koningiz ma'lumotlari va chek sozlamalari</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Do'kon nomi (Chek uchun)</label>
            <input 
              type="text" 
              value={storeName} 
              onChange={e => setStoreName(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl" 
            />
          </div>
          <button onClick={() => toast.success("Saqlandi!")} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700">
            Saqlash
          </button>
        </div>
      </div>

      {/* Admin Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Administrator sozlamalari</h2>
            <p className="text-sm text-slate-500">Tizim xavfsizligi va tahrirlash rejimlari</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <h3 className="font-bold text-slate-800">Tahrirlash Rejimi (Edit Mode)</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Buni yoqsangiz barcha bo'limlarda (Mijozlar, Kirim-chiqim) "Tahrirlash" va "O'chirish" tugmalari ko'rinadi. 
              Doimiy ishchi holatda xato bosilib ketmasligi uchun o'chirib qo'yish tavsiya etiladi.
            </p>
          </div>
          <button 
            onClick={() => {
              const newVal = !editMode;
              setEditMode(newVal);
              localStorage.setItem('pos_edit_mode', String(newVal));
              toast.success(newVal ? "Tahrirlash rejimi YOQILDI" : "Tahrirlash rejimi O'CHIRILDI");
            }}
            className={`px-6 py-2 rounded-xl font-bold transition-colors ${editMode ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'}`}
          >
            {editMode ? 'YONIQ' : "O'CHIQ"}
          </button>
        </div>
      </div>


    </div>
  );
}
