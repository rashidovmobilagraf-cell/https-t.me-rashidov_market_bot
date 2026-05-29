"use client";

import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, CheckCircle2, CreditCard, Banknote, Wallet } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import Map to prevent SSR issues
const Map = dynamic(() => import("@/components/Map"), { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">Xarita yuklanmoqda...</div> });

// Samarkand Registan Center (mock store location)
const STORE_LOCATION: [number, number] = [39.6542, 66.9597];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [position, setPosition] = useState<[number, number]>(STORE_LOCATION);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isSuccess, setIsSuccess] = useState(false);

  // Simple distance calculation (Haversine formula mock)
  const calculateDeliveryPrice = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Base price 15,000 for up to 3km, then 3000 per extra km
    if (distance <= 3) return 15000;
    return 15000 + Math.ceil(distance - 3) * 3000;
  };

  const deliveryPrice = useMemo(() => calculateDeliveryPrice(STORE_LOCATION[0], STORE_LOCATION[1], position[0], position[1]), [position]);
  const totalPrice = getTotalPrice() + deliveryPrice;

  const handleCheckout = () => {
    // Here we would send data to our API
    setIsSuccess(true);
    setTimeout(() => {
      clearCart();
      router.push("/");
    }, 3000);
  };

  if (items.length === 0 && !isSuccess) {
    router.push("/");
    return null;
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Buyurtma qabul qilindi!</h2>
        <p className="text-gray-500 text-center mb-8">Kuryer tez orada siz bilan bog'lanadi.</p>
        <div className="animate-pulse flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full delay-75"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full delay-150"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900">Rasmiylashtirish</h1>
      </header>

      {/* Map Section */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-2">Yetkazib berish manzili</h3>
        <p className="text-xs text-gray-500 mb-3">Xaritadan o'z manzilingizni belgilang:</p>
        <div className="w-full h-64 rounded-2xl overflow-hidden shadow-sm border border-gray-200 z-0">
          <Map position={position} setPosition={setPosition} />
        </div>
      </div>

      {/* Payment Selection */}
      <div className="px-4 mt-2">
        <h3 className="font-bold text-gray-900 mb-3">To'lov turi</h3>
        <div className="flex flex-col gap-2">
          
          <button 
            onClick={() => setPaymentMethod("cash")}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${paymentMethod === "cash" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${paymentMethod === "cash" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                <Banknote className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-900">Naqd pul</span>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cash" ? "border-blue-500" : "border-gray-300"}`}>
              {paymentMethod === "cash" && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
            </div>
          </button>

          <button 
            onClick={() => setPaymentMethod("click")}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${paymentMethod === "click" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${paymentMethod === "click" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-900">Click / Payme (Online)</span>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "click" ? "border-blue-500" : "border-gray-300"}`}>
              {paymentMethod === "click" && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
            </div>
          </button>

        </div>
      </div>

      {/* Summary */}
      <div className="px-4 mt-6">
        <h3 className="font-bold text-gray-900 mb-3">Chek</h3>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tovarlar ({items.length}):</span>
            <span>{getTotalPrice().toLocaleString()} s.</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Yetkazib berish:</span>
            <span>{deliveryPrice.toLocaleString()} s.</span>
          </div>
          <div className="h-px w-full bg-gray-100 my-1"></div>
          <div className="flex justify-between font-bold text-lg text-gray-900">
            <span>Jami:</span>
            <span>{totalPrice.toLocaleString()} so'm</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-50">
        <button 
          onClick={handleCheckout}
          className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
        >
          {totalPrice.toLocaleString()} so'm - To'lash
        </button>
      </div>

    </main>
  );
}
