'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, Trash2, Printer, CheckCircle } from 'lucide-react';

type CartItem = {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  quantity: number;
  stock: number;
};

export default function POSPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, P2P, DEBT, PERSONAL
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input
  useEffect(() => {
    if (!isCheckoutOpen) {
      inputRef.current?.focus();
    }
  }, [cart, isCheckoutOpen]);

  // Load customers for DEBT and CRM
  useEffect(() => {
    fetch('/api/customers').then(res => res.json()).then(data => setCustomers(data)).catch(() => {});
  }, []);

  // Load products for Catalog
  useEffect(() => {
    if (isCatalogOpen && products.length === 0) {
      fetch('/api/products').then(res => res.json()).then(data => setProducts(data)).catch(() => {});
    }
  }, [isCatalogOpen]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products?barcode=${barcode.trim()}`);
      if (!res.ok) {
        toast.error('Tovar topilmadi!');
        setBarcode('');
        return;
      }
      
      const product = await res.json();
      
      if (product.stock <= 0) {
        toast.error('Omborda mahsulot qolmagan!');
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
        return [...prev, { ...product, quantity: 1 }];
      });
      
      // Play a beep sound
      const audio = new Audio('https://www.soundjay.com/buttons/beep-07.wav');
      audio.play().catch(e => console.log('Audio error:', e));

      toast.success(`${product.name} qo'shildi`);
      setBarcode('');
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const addToCartFromCatalog = (product: any) => {
    if (product.stock <= 0) {
      toast.error('Omborda mahsulot qolmagan!');
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
      return [...prev, { ...product, quantity: 1 }];
    });
    const audio = new Audio('https://www.soundjay.com/buttons/beep-07.wav');
    audio.play().catch(e => console.log('Audio error:', e));
    toast.success(`${product.name} qo'shildi`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.stock) {
          return { ...item, quantity: newQ };
        }
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'DEBT' && !selectedCustomerId) {
      toast.error("Nasiya uchun mijozni tanlang!");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          totalAmount,
          paymentMethod,
          customerId: paymentMethod === 'DEBT' ? selectedCustomerId : null 
        }),
      });

      if (!res.ok) throw new Error('Xatolik');

      toast.success('Savdo muvaffaqiyatli amalga oshirildi!');
      
      window.print();

      setCart([]);
      setIsCheckoutOpen(false);
      setPaymentMethod('CASH');
      setSelectedCustomerId('');
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)]">
      {/* Left side: Cart */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart size={20} /> Savat
          </h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {cart.length} ta xil
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={48} className="mb-4 opacity-50" />
              <p>Savat bo'sh. Skaner orqali tovar qo'shing.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{item.name}</h3>
                  <p className="text-sm text-slate-500">{item.sellPrice.toLocaleString()} so'm</p>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 mr-4">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 font-bold">-</button>
                  <span className="font-semibold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 font-bold">+</button>
                </div>
                
                <div className="w-24 text-right font-bold text-slate-800 mr-4">
                  {(item.sellPrice * item.quantity).toLocaleString()}
                </div>

                <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 printable-hide">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6">To'lovni tasdiqlash</h2>
            <div className="text-center mb-8">
              <p className="text-slate-500 mb-2">Jami to'lanadigan summa</p>
              <p className="text-4xl font-bold text-blue-600">
                {totalAmount.toLocaleString()} so'm
              </p>
            </div>

            <div className="mb-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">To'lov usuli</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('CASH')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'CASH' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Naqd</button>
                <button onClick={() => setPaymentMethod('CARD')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'CARD' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Plastik Karta</button>
                <button onClick={() => setPaymentMethod('P2P')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'P2P' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>O'tkazma (Click/Payme)</button>
                <button onClick={() => setPaymentMethod('DEBT')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'DEBT' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Nasiya (Qarz)</button>
                <button onClick={() => setPaymentMethod('PERSONAL')} className={`col-span-2 py-2 rounded-lg font-medium ${paymentMethod === 'PERSONAL' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Shaxsiy Iste'mol</button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mijozni tanlang {paymentMethod === 'DEBT' ? <span className="text-red-500">* (Majburiy)</span> : <span className="text-slate-400">(Ixtiyoriy - baza uchun)</span>}
              </label>
              <select 
                value={selectedCustomerId} 
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg"
              >
                <option value="">-- Tanlang --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsCheckoutOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">
                Bekor qilish
              </button>
              <button onClick={handleCheckout} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600">
                Yakunlash & Chek
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right side: Scanner and Checkout */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <form onSubmit={handleScan}>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Shtrix-kod (Skanerlang):</label>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              disabled={loading}
              className="w-full p-4 text-lg bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-3"
              placeholder="||||||||||||||||||||"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={!barcode} className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-700">Kiritish</button>
              <button type="button" onClick={() => setIsCatalogOpen(true)} className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200">Katalog</button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">To'lov ma'lumoti</h3>
          
          <div className="flex-1">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500">Jami tovarlar:</span>
              <span className="font-semibold">{cart.reduce((s, i) => s + i.quantity, 0)} ta</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-100">
              <span className="text-lg font-semibold text-slate-700">Jami summa:</span>
              <span className="text-2xl font-bold text-blue-600">{totalAmount.toLocaleString()} so'm</span>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0 || loading}
            className="w-full mt-6 py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-200"
          >
            <CheckCircle size={24} /> To'lov & Chek
          </button>
        </div>
      </div>
      {/* Catalog Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex flex-col z-50 printable-hide">
          <div className="bg-white w-full h-full md:h-5/6 md:mt-auto md:rounded-t-3xl shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Katalog (Qo'lda tanlash)</h2>
              <button onClick={() => setIsCatalogOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-slate-700 font-bold hover:bg-slate-200">Yopish</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.length === 0 ? <p className="col-span-full text-center text-slate-500 mt-10">Tovarlar yo'q</p> :
                products.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => addToCartFromCatalog(p)}
                    className="flex flex-col text-left p-4 border border-slate-100 rounded-xl hover:border-blue-400 hover:shadow-md transition-all bg-white"
                  >
                    <span className="text-xs text-slate-400 mb-1">{p.barcode}</span>
                    <span className="font-bold text-slate-800 line-clamp-2 mb-2 leading-tight">{p.name}</span>
                    <div className="mt-auto flex justify-between items-end w-full">
                      <span className="font-bold text-blue-600">{p.sellPrice.toLocaleString()}</span>
                      <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded-md text-slate-600">{p.stock} ta</span>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
