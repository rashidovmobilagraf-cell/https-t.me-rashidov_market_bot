'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Phone, ArrowDownToLine } from 'lucide-react';

export default function NasiyaPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleRepayment = async (customerId: string) => {
    const amountStr = prompt("Qancha qarz uzildi? (so'mda)");
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return toast.error("Noto'g'ri summa");

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DEBT_REPAYMENT',
          amount,
          description: "Qarz to'lovi",
          customerId
        })
      });
      if (!res.ok) throw new Error();
      toast.success("Qarz to'lovi qabul qilindi");
      fetchCustomers();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  // Faqat qarzi borlarni ajratib olamiz
  const debtors = customers.filter(c => c.balance > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Nasiya Daftar</h1>
      </div>

      {loading ? <p>Yuklanmoqda...</p> : debtors.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-xl">Hozirda hech kimning qarzi yo'q!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debtors.map(customer => (
            <div key={customer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{customer.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Phone size={14} /> {customer.phone || 'Kiritilmagan'}</p>
                </div>
                <div className="bg-red-100 text-red-700 p-2 rounded-lg">
                  <ArrowDownToLine size={20} />
                </div>
              </div>
              
              <div className="py-4 border-t border-b border-slate-50 mb-4">
                <p className="text-sm text-slate-500 mb-1">Qarzdorlik summasi</p>
                <p className="text-2xl font-bold text-red-600">
                  {customer.balance.toLocaleString()} so'm
                </p>
              </div>

              <button 
                onClick={() => handleRepayment(customer.id)}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg transition-colors"
              >
                Qarzni uzish (To'lov)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
