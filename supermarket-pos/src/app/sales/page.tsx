'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setSales(data);
    } catch {
      toast.error('Xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  const handleCancelSale = async (id: string) => {
    if (!confirm("Rostdan ham bu savdoni bekor qilmoqchimisiz? Tovarlar omborga qaytadi, pul hisobdan o'chadi.")) return;
    
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xatolik');
      toast.success("Savdo bekor qilindi (Otmena)");
      fetchSales();
    } catch (error) {
      toast.error("O'chirishda xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Savdolar Tarixi (Cheklar)</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Sana</th>
              <th className="px-6 py-4 font-semibold">To'lov Usuli</th>
              <th className="px-6 py-4 font-semibold">Summa</th>
              <th className="px-6 py-4 font-semibold">Tovarlar</th>
              <th className="px-6 py-4 font-semibold text-right">Harakat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8">Yuklanmoqda...</td></tr> : 
              sales.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-slate-500">Hozircha savdolar yo'q</td></tr> :
              sales.map(sale => (
                <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-6 py-4">{format(new Date(sale.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                  <td className="px-6 py-4 font-medium align-top">
                    {sale.paymentMethod === 'CASH' && <span className="text-emerald-600">Naqd</span>}
                    {sale.paymentMethod === 'CARD' && <span className="text-blue-600">Karta</span>}
                    {sale.paymentMethod === 'P2P' && <span className="text-purple-600">O'tkazma</span>}
                    {sale.paymentMethod === 'DEBT' && <span className="text-red-600">Nasiya {sale.customer ? `(${sale.customer.name})` : ''}</span>}
                    {sale.paymentMethod === 'PERSONAL' && <span className="text-orange-600">Shaxsiy Iste'mol</span>}
                    {sale.paymentMethod === 'MIXED' && (
                      <div className="flex flex-col text-[11px] space-y-0.5 mt-1 border-l-2 border-purple-200 pl-2">
                        <span className="text-purple-700 font-bold text-sm mb-1">Aralash</span>
                        {sale.cashAmount > 0 && <span className="text-emerald-600">Naqd: {sale.cashAmount.toLocaleString()}</span>}
                        {sale.cardAmount > 0 && <span className="text-blue-600">Karta: {sale.cardAmount.toLocaleString()}</span>}
                        {sale.p2pAmount > 0 && <span className="text-purple-600">O'tkazma: {sale.p2pAmount.toLocaleString()}</span>}
                        {sale.debtAmount > 0 && <span className="text-red-600">Nasiya: {sale.debtAmount.toLocaleString()} {sale.customer ? `(${sale.customer.name})` : ''}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{sale.totalAmount.toLocaleString()} so'm</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {sale.items.map((item: any) => (
                        <span key={item.id} className="text-xs text-slate-500">
                          {item.quantity}x {item.product?.name || 'Noma\'lum'} ({(item.quantity * item.price).toLocaleString()} so'm)
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleCancelSale(sale.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg font-medium flex items-center gap-2 ml-auto transition-colors">
                      <Trash2 size={16} /> Bekor qilish
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
