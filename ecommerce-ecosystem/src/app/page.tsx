"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";

const PRODUCTS = [
  { id: "1", name: "Snickers shokoladli batoni 80g", price: 9600, oldPrice: 12000, category: "Shirinliklar" },
  { id: "2", name: "Coca-Cola 1.5L Klassik", price: 14000, oldPrice: null, category: "Ichimliklar" },
  { id: "3", name: "Lay's Pishloq Ta'mli Chips 90g", price: 15000, oldPrice: 16500, category: "Oziq-ovqat" },
  { id: "4", name: "Nestle Qadoqlangan suv 1L", price: 3500, oldPrice: null, category: "Ichimliklar" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  // Prevent hydration errors with Zustand persist
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            R
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-gray-900">Rashidov Market</h1>
            <p className="text-xs text-gray-500">Tez va ishonchli yetkazib berish</p>
          </div>
        </div>
        <Link href="/cart" className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <ShoppingCart className="w-6 h-6 text-gray-700" />
          {mounted && getTotalItems() > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
              {getTotalItems()}
            </span>
          )}
        </Link>
      </header>

      {/* Hero / Banner */}
      <div className="px-4 mt-4">
        <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <h2 className="text-white font-bold text-xl w-2/3">Yangi yil chegirmalari!</h2>
            <p className="text-blue-100 text-sm mt-1">Barcha tovarlarga 50% gacha</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 mt-6 pb-2">
        {["Barchasi", "Yangi", "Oziq-ovqat", "Ichimliklar", "Shirinliklar", "Uy uchun"].map((cat, i) => (
          <button 
            key={i}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              i === 0 
                ? "bg-gray-900 text-white shadow-md" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bento Grid Catalog */}
      <div className="px-4 mt-6">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Ommabop tovarlar</h3>
        <div className="grid grid-cols-2 gap-3">
          
          {PRODUCTS.map((product) => {
            const itemInCart = cartItems.find((item) => item.id === product.id);
            return (
              <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col justify-between h-full group relative overflow-hidden">
                <div className="relative w-full aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  {product.oldPrice && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 line-clamp-1">{product.category}</p>
                  <h4 className="font-semibold text-sm text-gray-900 leading-tight mb-2 line-clamp-2">{product.name}</h4>
                  <div className="flex items-center gap-2 mb-1">
                    {product.oldPrice && (
                      <span className="text-xs text-gray-400 line-through">{product.oldPrice.toLocaleString()}</span>
                    )}
                    <span className="font-bold text-md text-red-500">{product.price.toLocaleString()} s.</span>
                  </div>
                </div>
                
                {itemInCart ? (
                   <button 
                    onClick={() => addItem(product)}
                    className="w-full mt-2 bg-blue-600 text-white font-medium py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1"
                   >
                     + {itemInCart.quantity} ta qoshildi
                   </button>
                ) : (
                  <button 
                    onClick={() => addItem(product)}
                    className="w-full mt-2 bg-gray-100 text-gray-900 font-medium py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                  >
                    Savatga
                  </button>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </main>
  );
}
