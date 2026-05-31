"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error("Ma'lumotni olishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) throw new Error();
      toast.success("Holat yangilandi");
      fetchOrders();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Truck className="text-blue-600" /> Avto-Buyurtmalar (Ta'minotchi)
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Sana</th>
              <th className="px-6 py-4 font-semibold">Tovar</th>
              <th className="px-6 py-4 font-semibold">Tavsiya Qilingan Miqdor</th>
              <th className="px-6 py-4 font-semibold">Holat</th>
              <th className="px-6 py-4 font-semibold text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Yuklanmoqda...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">Buyurtmalar yo'q</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {order.product?.name}
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{order.product?.barcode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                      {order.quantity} ta
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'PENDING' && <span className="flex items-center gap-1 text-amber-600 font-semibold"><Clock size={16} /> Kutilmoqda</span>}
                    {order.status === 'COMPLETED' && <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle size={16} /> Bajarildi</span>}
                    {order.status === 'CANCELLED' && <span className="flex items-center gap-1 text-red-600 font-semibold">Bekor qilindi</span>}
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-lg text-xs transition-colors">Bajarildi</button>
                        <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors">Bekor qilish</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
