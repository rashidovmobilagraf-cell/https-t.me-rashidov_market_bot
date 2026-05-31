"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { ShoppingBag, CreditCard, Banknote, XCircle, ArrowRight, ScanLine, CheckCircle } from "lucide-react";

export default function SelfCheckout() {
  const [cart, setCart] = useState<any[]>([]);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"SCAN" | "PAYMENT" | "SUCCESS">("SCAN");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on hidden input for scanner
  useEffect(() => {
    if (step === "SCAN") {
      const interval = setInterval(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim() || step !== "SCAN") return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products?barcode=${barcode.trim()}`);
      if (!res.ok) {
        toast.error('Tovar topilmadi', { position: 'top-center', style: { fontSize: '1.5rem', padding: '16px' } });
        setBarcode('');
        return;
      }
      
      const product = await res.json();
      if (product.stock <= 0) {
        toast.error('Omborda yo\'q!', { position: 'top-center', style: { fontSize: '1.5rem', padding: '16px' } });
        setBarcode('');
        return;
      }

      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            toast.error(`Sotuvda faqat ${product.stock} ta bor`);
            return prev;
          }
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [{ ...product, quantity: 1 }, ...prev];
      });
      
      playBeep();
      setBarcode('');
    } catch (error) {
      toast.error('Xatolik');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

  const handlePayment = async (method: "CASH" | "CARD") => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          totalAmount,
          paymentMethod: method,
          cashAmount: method === 'CASH' ? totalAmount : 0,
          cardAmount: method === 'CARD' ? totalAmount : 0,
        }),
      });

      if (!res.ok) throw new Error();

      setStep("SUCCESS");
      
      // Auto reset after 5 seconds
      setTimeout(() => {
        setCart([]);
        setStep("SCAN");
      }, 5000);

    } catch (error) {
      toast.error("To'lovda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const result = prev.map(item => {
        if (item.id === id) {
          const newQ = item.quantity + delta;
          if (newQ > 0 && newQ <= item.stock) return { ...item, quantity: newQ };
        }
        return item;
      });
      return result;
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  if (step === "SUCCESS") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-700 flex flex-col items-center justify-center text-white p-6">
        <div className="bg-white/10 p-10 rounded-full mb-8 animate-bounce shadow-2xl">
          <CheckCircle size={120} className="text-white" />
        </div>
        <h1 className="text-6xl font-extrabold mb-6 text-center drop-shadow-md">XARIDINGIZ UCHUN RAHMAT!</h1>
        <p className="text-3xl font-medium text-emerald-100 text-center max-w-2xl drop-shadow-sm mb-4">
          Chekingizni oling va yana tashrif buyuring. Xayr-salomat bo'ling!
        </p>
        <p className="text-4xl font-bold text-white text-center max-w-3xl drop-shadow-md bg-black/20 px-8 py-4 rounded-2xl">
          Sizni yana do'konimizda kutib qolamiz! 😊
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Hidden input for scanner */}
      <form onSubmit={handleScan} className="opacity-0 absolute top-0 left-0 w-0 h-0 overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          autoFocus
        />
        <button type="submit">Qo'shish</button>
      </form>

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center shadow-lg relative z-10">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-blue-500/30 shadow-lg">
            <ShoppingBag size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">O'Z-O'ZIGA XIZMAT</h1>
            <p className="text-blue-400 font-bold tracking-widest text-sm uppercase">RASHIDOV MARKET</p>
          </div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur px-6 py-3 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Jami To'lov</p>
          <p className="text-4xl font-extrabold text-emerald-400">{totalAmount.toLocaleString()} <span className="text-2xl text-emerald-500/70">so'm</span></p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {step === "SCAN" && (
          <>
            {/* Left side: Instructions / Big Scanner Animation */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/0 to-transparent"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative bg-slate-800/50 p-12 rounded-full border border-slate-700/50 mb-10 shadow-2xl backdrop-blur-sm">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping"></div>
                  <ScanLine size={100} className="text-blue-400" />
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] transform -translate-y-1/2 animate-scan"></div>
                </div>
                
                <h2 className="text-5xl font-black text-white mb-6 text-center leading-tight drop-shadow-md">
                  Tovarni skanerdan <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">o'tkazing</span>
                </h2>
                <p className="text-2xl text-slate-400 text-center max-w-md font-medium">
                  Shtrix-kodni skanerga tuting. Tovar avtomatik ravishda ekranda paydo bo'ladi.
                </p>
              </div>
            </div>

            {/* Right side: Cart Items */}
            <div className="w-[600px] bg-slate-900/80 flex flex-col relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
              <div className="p-6 bg-slate-800/50 border-b border-slate-700/50">
                <h3 className="text-2xl font-bold text-white">Xaridlar ro'yxati ({cart.length})</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <ShoppingBag size={80} className="mb-6 opacity-20" />
                    <p className="text-xl font-medium">Savat hozircha bo'sh</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl flex items-center gap-6 shadow-lg animate-in slide-in-from-right-4">
                      <div className="flex-1">
                        <h4 className="text-2xl font-bold text-white mb-2">{item.name}</h4>
                        <p className="text-blue-400 font-bold text-xl">{item.sellPrice.toLocaleString()} so'm</p>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-12 h-12 rounded-lg bg-slate-800 text-white font-bold text-2xl flex items-center justify-center hover:bg-slate-700">-</button>
                        <span className="w-8 text-center font-bold text-2xl">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-12 h-12 rounded-lg bg-slate-800 text-white font-bold text-2xl flex items-center justify-center hover:bg-slate-700">+</button>
                      </div>
                      
                      <button onClick={() => removeItem(item.id)} className="w-14 h-14 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <XCircle size={32} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Button fixed at bottom */}
              <div className="p-6 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <button
                  onClick={() => setStep("PAYMENT")}
                  disabled={cart.length === 0}
                  className="w-full py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-2xl font-black text-3xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-4 group"
                >
                  TO'LOVGA O'TISH
                  {cart.length > 0 && <ArrowRight size={36} className="group-hover:translate-x-2 transition-transform" />}
                </button>
              </div>
            </div>
          </>
        )}

        {step === "PAYMENT" && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-10 relative z-10">
            <button 
              onClick={() => setStep("SCAN")} 
              className="absolute top-10 left-10 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 flex items-center gap-2 text-xl"
            >
              ← Orqaga
            </button>
            
            <h2 className="text-5xl font-black text-white mb-4 drop-shadow-md">To'lov usulini tanlang</h2>
            <p className="text-2xl text-slate-400 mb-16">To'lanadigan summa: <span className="font-bold text-emerald-400">{totalAmount.toLocaleString()} so'm</span></p>

            <div className="flex gap-8 w-full max-w-4xl">
              <button 
                onClick={() => handlePayment("CASH")}
                disabled={loading}
                className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-700 p-12 rounded-[2rem] shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex flex-col items-center justify-center gap-6 group"
              >
                <div className="bg-white/20 p-8 rounded-full group-hover:scale-110 transition-transform">
                  <Banknote size={80} className="text-white" />
                </div>
                <span className="text-4xl font-black text-white drop-shadow-sm">NAQD PUL</span>
                <span className="text-emerald-100 font-medium text-lg">Kassaga to'lov qilish</span>
              </button>

              <button 
                onClick={() => handlePayment("CARD")}
                disabled={loading}
                className="flex-1 bg-gradient-to-br from-blue-500 to-indigo-700 p-12 rounded-[2rem] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-transform flex flex-col items-center justify-center gap-6 group"
              >
                <div className="bg-white/20 p-8 rounded-full group-hover:scale-110 transition-transform">
                  <CreditCard size={80} className="text-white" />
                </div>
                <span className="text-4xl font-black text-white drop-shadow-sm">PLASTIK KARTA</span>
                <span className="text-blue-100 font-medium text-lg">Terminal orqali</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
