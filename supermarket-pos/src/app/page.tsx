'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, PackageMinus, AlertTriangle, Ghost } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-500">Ma'lumotlar yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Boshqaruv Paneli</h1>
      
      {/* Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Bugungi Savdo</p>
            <p className="text-xl font-bold text-slate-800">{data?.todaySalesTotal?.toLocaleString()} so'm</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Sof Foyda (Bugun)</p>
            <p className="text-xl font-bold text-slate-800">{data?.netProfit?.toLocaleString()} so'm</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-red-100 text-red-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Xarajatlar (Bugun)</p>
            <p className="text-xl font-bold text-slate-800">{data?.todayExpenses?.toLocaleString()} so'm</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Umumiy Qarzdorlik</p>
            <p className="text-xl font-bold text-slate-800">{data?.totalDebt?.toLocaleString()} so'm</p>
          </div>
        </div>
      </div>

      {/* Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-xl">
            <PackageMinus size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Kam Qolganlar</p>
            <p className="text-2xl font-bold text-slate-800">{data?.lowStock?.length || 0} ta</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Srogi Yaqinlar</p>
            <p className="text-2xl font-bold text-slate-800">{data?.expiringSoon?.length || 0} ta</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-slate-100 text-slate-600 rounded-xl">
            <Ghost size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">O'lik Zaxira</p>
            <p className="text-2xl font-bold text-slate-800">{data?.deadStock?.length || 0} ta</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-semibold text-slate-800">Xit Savdolar (Top 5)</h2>
          </div>
          <div className="p-6">
            {data?.topSelling?.length === 0 ? (
              <p className="text-slate-500 text-sm">Savdolar yo'q</p>
            ) : (
              <ul className="space-y-4">
                {data?.topSelling?.map((item: any) => (
                  <li key={item.id} className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">{item.soldQuantity} ta sotildi</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-red-50/50">
            <h2 className="font-semibold text-red-800">Yaroqlilik muddati yaqinlashayotganlar</h2>
          </div>
          <div className="p-6">
            {data?.expiringSoon?.length === 0 ? (
              <p className="text-slate-500 text-sm">Xavotirga o'rin yo'q</p>
            ) : (
              <ul className="space-y-4">
                {data?.expiringSoon?.map((item: any) => (
                  <li key={item.id} className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="text-red-600 text-sm font-semibold">
                      {item.expiryDate ? format(new Date(item.expiryDate), 'dd.MM.yyyy') : "Noma'lum"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
