"use client";

import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, Minus, Plus, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, addItem, decreaseQuantity, removeItem, getTotalPrice } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Yuklanmoqda...</div>;

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Savatcha bo'sh</h2>
        <p className="text-gray-500 text-center mb-6">Xaridni davom ettirish uchun tovarlarni katalogdan tanlang</p>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Katalogga qaytish
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900">Savatcha</h1>
      </header>

      {/* Cart Items */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-2xl flex gap-3 shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
              {/* Image placeholder */}
            </div>
            <div className="flex flex-col justify-between flex-grow">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 leading-tight">{item.name}</h3>
                <p className="font-bold text-blue-600 text-sm mt-1">{item.price.toLocaleString()} s.</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <button onClick={() => removeItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button onClick={() => decreaseQuantity(item.id)} className="p-1 bg-white rounded-md shadow-sm text-gray-700">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => addItem(item)} className="p-1 bg-white rounded-md shadow-sm text-gray-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500 font-medium">Jami to'lov:</span>
          <span className="font-bold text-xl text-gray-900">{getTotalPrice().toLocaleString()} so'm</span>
        </div>
        <Link href="/checkout" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
          Rasmiylashtirish <MapPin className="w-5 h-5" />
        </Link>
      </div>
    </main>
  );
}
