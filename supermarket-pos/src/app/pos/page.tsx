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
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, P2P, DEBT, PERSONAL, MIXED
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Mixed payment states
  const [cashAmount, setCashAmount] = useState<number | ''>('');
  const [cardAmount, setCardAmount] = useState<number | ''>('');
  const [p2pAmount, setP2pAmount] = useState<number | ''>('');
  const [debtAmount, setDebtAmount] = useState<number | ''>('');
  const [cashbackUsed, setCashbackUsed] = useState<number | ''>('');
  const [cashierId, setCashierId] = useState<string>('');
  const [crossSellMessage, setCrossSellMessage] = useState<string | null>(null);

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = localStorage.getItem('pos_user');
    if (user) setCashierId(JSON.parse(user).id);
  }, []);

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
      playBeep();

      if (product.crossSellMessage) {
        setCrossSellMessage(product.crossSellMessage);
        toast(product.crossSellMessage, { icon: '💡', duration: 4000 });
      } else {
        setCrossSellMessage(null);
      }

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
    playBeep();
    
    if (product.crossSellMessage) {
      setCrossSellMessage(product.crossSellMessage);
      toast(product.crossSellMessage, { icon: '💡', duration: 4000 });
    } else {
      setCrossSellMessage(null);
    }
    
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
    if (paymentMethod === 'MIXED') {
      const sum = (Number(cashAmount) || 0) + (Number(cardAmount) || 0) + (Number(p2pAmount) || 0) + (Number(debtAmount) || 0);
      if (sum !== totalAmount) {
        toast.error(`Summalar yig'indisi (${sum}) umumiy summaga (${totalAmount}) teng emas!`);
        return;
      }
      if ((Number(debtAmount) || 0) > 0 && !selectedCustomerId) {
        toast.error("Nasiya aralashganligi uchun mijozni tanlashingiz shart!");
        return;
      }
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
          cashAmount: Number(cashAmount) || 0,
          cardAmount: Number(cardAmount) || 0,
          p2pAmount: Number(p2pAmount) || 0,
          debtAmount: Number(debtAmount) || 0,
          cashbackUsed: Number(cashbackUsed) || 0,
          cashierId: cashierId,
          customerId: (paymentMethod === 'DEBT' || (paymentMethod === 'MIXED' && Number(debtAmount) > 0) || Number(cashbackUsed) > 0) ? selectedCustomerId : (selectedCustomerId || null)
        }),
      });

      if (!res.ok) throw new Error('Xatolik');

      toast.success('Savdo muvaffaqiyatli amalga oshirildi!');
      
      window.print();

      setCart([]);
      setIsCheckoutOpen(false);
      setPaymentMethod('CASH');
      setSelectedCustomerId('');
      setCashAmount('');
      setCardAmount('');
      setP2pAmount('');
      setDebtAmount('');
      setCashbackUsed('');
      setCrossSellMessage(null);
      // Refresh customers to get updated cashback balance
      fetch('/api/customers').then(res => res.json()).then(data => setCustomers(data));
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)] printable-hide">
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
                
                <div className="flex flex-col items-center gap-1 mr-4">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 font-bold">-</button>
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0.001" 
                      value={item.quantity} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val > 0) {
                          setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: val } : i));
                        }
                      }}
                      className="font-semibold w-16 text-center bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 font-bold">+</button>
                  </div>
                  <button 
                    onClick={() => {
                      const inputAmount = window.prompt(`${item.name} uchun xaridor bergan pulni kiriting (Masalan: 1000 so'm):`);
                      if (inputAmount && !isNaN(Number(inputAmount))) {
                        const amount = Number(inputAmount);
                        const calculatedWeight = amount / item.sellPrice;
                        setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Number(calculatedWeight.toFixed(3)) } : i));
                      }
                    }}
                    className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200"
                  >
                    Summadan hisoblash
                  </button>
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
            <div className="text-center mb-6">
              <p className="text-slate-500 mb-2">Jami to'lanadigan summa</p>
              <p className="text-4xl font-bold text-blue-600">
                {Math.max(0, totalAmount - (Number(cashbackUsed) || 0)).toLocaleString()} so'm
              </p>
              {Number(cashbackUsed) > 0 && (
                <p className="text-sm text-slate-500 mt-1">({totalAmount.toLocaleString()} - {Number(cashbackUsed).toLocaleString()} bonus)</p>
              )}
            </div>

            <div className="mb-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">To'lov usuli</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('CASH')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'CASH' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Naqd</button>
                <button onClick={() => setPaymentMethod('CARD')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'CARD' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Plastik Karta</button>
                <button onClick={() => setPaymentMethod('P2P')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'P2P' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>O'tkazma</button>
                <button onClick={() => setPaymentMethod('DEBT')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'DEBT' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Nasiya (Qarz)</button>
                <button onClick={() => setPaymentMethod('MIXED')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'MIXED' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Aralash</button>
                <button onClick={() => setPaymentMethod('PERSONAL')} className={`py-2 rounded-lg font-medium ${paymentMethod === 'PERSONAL' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Shaxsiy</button>
              </div>
            </div>

            {paymentMethod === 'MIXED' && (
              <div className="mb-6 grid grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Naqd</label>
                  <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Karta</label>
                  <input type="number" value={cardAmount} onChange={e => setCardAmount(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">O'tkazma</label>
                  <input type="number" value={p2pAmount} onChange={e => setP2pAmount(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nasiya</label>
                  <input type="number" value={debtAmount} onChange={e => setDebtAmount(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 border rounded" />
                </div>
                <div className="col-span-2 text-right text-sm font-bold mt-2">
                  Kiritildi: <span className={((Number(cashAmount)||0) + (Number(cardAmount)||0) + (Number(p2pAmount)||0) + (Number(debtAmount)||0)) === totalAmount ? "text-emerald-600" : "text-red-500"}>
                    {((Number(cashAmount)||0) + (Number(cardAmount)||0) + (Number(p2pAmount)||0) + (Number(debtAmount)||0)).toLocaleString()}
                  </span> / {totalAmount.toLocaleString()}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mijozni tanlang {paymentMethod === 'DEBT' || (paymentMethod === 'MIXED' && Number(debtAmount) > 0) ? <span className="text-red-500">* (Majburiy)</span> : <span className="text-slate-400">(Ixtiyoriy)</span>}
              </label>
              <select 
                value={selectedCustomerId} 
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setCashbackUsed('');
                }}
                className="w-full p-3 border border-slate-200 rounded-lg mb-3"
              >
                <option value="">-- Tanlang --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>

              {selectedCustomerId && (() => {
                const c = customers.find(x => x.id === selectedCustomerId);
                if (c && c.cashbackBalance > 0) {
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Mijoz Bonusi</p>
                        <p className="text-lg font-bold text-emerald-700">{c.cashbackBalance.toLocaleString()} so'm</p>
                      </div>
                      <div className="w-1/2">
                        <label className="block text-[10px] font-semibold text-emerald-600 mb-1">Qanchasini ishlatasiz?</label>
                        <input 
                          type="number" 
                          max={Math.min(c.cashbackBalance, totalAmount)}
                          value={cashbackUsed} 
                          onChange={e => {
                            const val = Number(e.target.value);
                            if (val <= Math.min(c.cashbackBalance, totalAmount)) {
                              setCashbackUsed(val || '');
                            }
                          }}
                          className="w-full p-2 border border-emerald-200 rounded text-sm text-right font-bold text-emerald-700" 
                          placeholder="Summa"
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
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
          
          {crossSellMessage && (
            <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl animate-pulse">
              <h4 className="text-amber-800 font-bold text-sm uppercase mb-1">💡 Taklif qiling</h4>
              <p className="text-amber-900 font-semibold text-lg">{crossSellMessage}</p>
            </div>
          )}
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

    {/* Printable Receipt */}
    <div className="print-only p-4 w-[80mm] text-black font-mono mx-auto text-sm">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">RASHIDOV MARKET</h2>
        <div className="text-[11px] mt-1 text-slate-800 leading-tight">
          <p>URGUT SHAHAR</p>
          <p>Markaziy ko'cha, Kamardon mahallasi</p>
          <p className="text-[10px] mt-0.5">(1-maktabdan o'tib, 4-MTM ga yetmasdan)</p>
        </div>
        <p className="text-xs mt-2 font-semibold">{new Date().toLocaleString()}</p>
      </div>
      
      <div className="border-b border-dashed border-black mb-2"></div>
      
      <table className="w-full text-left mb-2 text-xs">
        <thead>
          <tr>
            <th className="pb-1">Nomi</th>
            <th className="pb-1 text-center">Soni</th>
            <th className="pb-1 text-right">Summa</th>
          </tr>
        </thead>
        <tbody>
          {cart.map(item => (
            <tr key={item.id}>
              <td className="py-1 break-words max-w-[40mm]">{item.name}</td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-right">{(item.quantity * item.sellPrice).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="border-b border-dashed border-black mb-2"></div>
      
      <div className="flex justify-between font-bold text-base mb-4">
        <span>JAMI:</span>
        <span>{totalAmount.toLocaleString()} so'm</span>
      </div>

      <div className="text-xs mb-4">
        <p>To'lov usuli: 
          {paymentMethod === 'CASH' && ' Naqd'}
          {paymentMethod === 'CARD' && ' Karta'}
          {paymentMethod === 'P2P' && ' O\'tkazma'}
          {paymentMethod === 'DEBT' && ' Nasiya'}
          {paymentMethod === 'PERSONAL' && ' Shaxsiy iste\'mol'}
          {paymentMethod === 'MIXED' && ' Aralash to\'lov'}
        </p>
      </div>

      <div className="text-center mt-6">
        <p className="font-bold">XARIDINGIZ UCHUN RAHMAT!</p>
        <p className="mt-1 text-xs font-semibold text-slate-800">Sizni yana do'konimizda kutib qolamiz.</p>
      </div>
    </div>
    </>
  );
}
