import React, { useState, useEffect } from 'react';
import { Trash2, Send, Save, MapPin, ImagePlus } from 'lucide-react';

const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

const showAlert = (msg) => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
    window.Telegram.WebApp.showAlert(msg);
  } else {
    alert(msg);
  }
};

export const AnalyticsTab = ({ orders }) => {
    const totalRevenue = orders.filter(o => o.status === 'Bajarildi').reduce((acc, o) => acc + (o.total || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.date && o.date.startsWith(today));
    const todayRevenue = todayOrders.filter(o => o.status === 'Bajarildi').reduce((acc, o) => acc + (o.total || 0), 0);

    return (
        <div style={{padding: 16}}>
            <h3 style={{marginBottom: 16, color: '#334155'}}>📊 Statistika</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                <div style={{background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                    <div style={{fontSize: 13, color: '#64748b'}}>Bugungi savdo</div>
                    <div style={{fontSize: 20, fontWeight: 700, color: '#0d9472', marginTop: 8}}>{todayRevenue.toLocaleString()} so'm</div>
                    <div style={{fontSize: 12, color: '#94a3b8', marginTop: 4}}>{todayOrders.length} ta buyurtma</div>
                </div>
                <div style={{background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                    <div style={{fontSize: 13, color: '#64748b'}}>Jami tushum</div>
                    <div style={{fontSize: 20, fontWeight: 700, color: '#3b82f6', marginTop: 8}}>{totalRevenue.toLocaleString()} so'm</div>
                    <div style={{fontSize: 12, color: '#94a3b8', marginTop: 4}}>{orders.filter(o => o.status === 'Bajarildi').length} ta bajarilgan</div>
                </div>
            </div>
        </div>
    );
};

export const PromoTab = ({ storeId }) => {
    const [codes, setCodes] = useState([]);
    const [newCode, setNewCode] = useState('');
    const [discount, setDiscount] = useState('');
    const [isPercent, setIsPercent] = useState(true);

    const loadCodes = async () => {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?store_id=eq.${storeId}`, {
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
            });
            const data = await res.json();
            setCodes(Array.isArray(data) ? data : []);
        } catch(e) {}
    };

    useEffect(() => { if (storeId) loadCodes(); }, [storeId]);

    const addCode = async () => {
        if (!newCode || !discount) return showAlert("Maydonlarni to'ldiring");
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/promo_codes`, {
                method: 'POST',
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ store_id: storeId, code: newCode.toUpperCase(), discount: parseFloat(discount), is_percent: isPercent })
            });
            if (res.ok) {
                showAlert("Qo'shildi!");
                setNewCode(''); setDiscount('');
                loadCodes();
            } else showAlert("Xatolik. Kod oldin kiritilgan bo'lishi mumkin.");
        } catch(e) {}
    };

    const deleteCode = async (id) => {
        if (!window.confirm("O'chirasizmi?")) return;
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${id}`, {
                method: 'DELETE',
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
            });
            loadCodes();
        } catch(e) {}
    };

    return (
        <div style={{padding: 16}}>
            <h3 style={{marginBottom: 16, color: '#334155'}}>🎟 Promokodlar</h3>
            <div style={{background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 16}}>
                <input className="input-field" placeholder="Kod (masalan: CHEGIRMA20)" value={newCode} onChange={e=>setNewCode(e.target.value)} style={{textTransform: 'uppercase'}}/>
                <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
                    <input className="input-field" type="number" placeholder="Chegirma miqdori" value={discount} onChange={e=>setDiscount(e.target.value)} style={{marginBottom: 0, flex: 1}}/>
                    <select className="input-field" value={isPercent ? "percent" : "fixed"} onChange={e=>setIsPercent(e.target.value === 'percent')} style={{marginBottom: 0, width: 100}}>
                        <option value="percent">%</option>
                        <option value="fixed">So'm</option>
                    </select>
                </div>
                <button className="btn-primary" onClick={addCode}>Qo'shish</button>
            </div>
            {codes.map(c => (
                <div key={c.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 16px', borderRadius: 12, marginBottom: 8}}>
                    <div>
                        <div style={{fontWeight: 700, color: '#1e293b'}}>{c.code}</div>
                        <div style={{fontSize: 13, color: '#64748b'}}>-{c.discount}{c.is_percent ? '%' : " so'm"}</div>
                    </div>
                    <button onClick={() => deleteCode(c.id)} style={{background: 'none', border: 'none', color: '#ef4444', padding: 8}}><Trash2 size={18}/></button>
                </div>
            ))}
        </div>
    );
};

export const BroadcastTab = ({ storeId }) => {
    const [text, setText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setImageUrl(event.target.result);
        reader.readAsDataURL(file);
    };

    const sendBroadcast = async () => {
        if (!text.trim() && !imageUrl) return showAlert("Xabar yozing yoki rasm yuklang");
        if (!window.confirm("Barcha mijozlarga xabar yuborilsinmi?")) return;
        setLoading(true);
        try {
            const res = await fetch('https://webapp-kohl-kappa.vercel.app/api/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ store_id: storeId, text, image_url: imageUrl, admin_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id })
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                showAlert(`Xabar ${data.sent} ta mijozga yuborildi!`);
                setText(''); setImageUrl('');
            } else {
                showAlert("Xatolik yuz berdi: " + (data.error || ""));
            }
        } catch(e) {
            showAlert("Xatolik yuz berdi");
        }
        setLoading(false);
    };

    return (
        <div style={{padding: 16}}>
            <h3 style={{marginBottom: 16, color: '#334155'}}>📣 Ommaviy xabar yuborish</h3>
            <div style={{background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                {imageUrl && <img src={imageUrl} alt="preview" style={{width: '100%', borderRadius: 12, marginBottom: 12, maxHeight: 200, objectFit: 'cover'}} />}
                <label style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#f1f5f9', borderRadius: 12, marginBottom: 12, cursor: 'pointer', color: '#64748b'}}>
                    <ImagePlus size={18} /> Rasm qo'shish
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} />
                </label>
                <textarea 
                    className="input-field" 
                    placeholder="Xabar matni..." 
                    rows={5}
                    value={text} 
                    onChange={e=>setText(e.target.value)}
                />
                <button className="btn-primary" onClick={sendBroadcast} disabled={loading} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                    <Send size={18} /> {loading ? "Yuborilmoqda..." : "Yuborish"}
                </button>
            </div>
        </div>
    );
};

export const SettingsTab = ({ storeId }) => {
    const [store, setStore] = useState({ lat: '', lon: '', delivery_price: 500, card_number: '' });

    useEffect(() => {
        if (storeId) {
            fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
            }).then(res => res.json()).then(data => {
                if (data && data.length > 0) {
                    const s = data[0];
                    setStore({
                        lat: s.lat || '', lon: s.lon || '', 
                        delivery_price: s.delivery_price || 500, 
                        card_number: s.card_number || ''
                    });
                }
            });
        }
    }, [storeId]);

    const saveSettings = async () => {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}`, {
                method: 'PATCH',
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    lat: store.lat ? parseFloat(store.lat) : null,
                    lon: store.lon ? parseFloat(store.lon) : null,
                    delivery_price: parseFloat(store.delivery_price) || 0,
                    card_number: store.card_number
                })
            });
            if (res.ok) showAlert("Saqlandi!");
            else showAlert("Xatolik!");
        } catch(e) { showAlert("Xatolik!"); }
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setStore(prev => ({...prev, lat: pos.coords.latitude, lon: pos.coords.longitude}));
            });
        } else {
            showAlert("Geolokatsiya ishlamaydi");
        }
    };

    return (
        <div style={{padding: 16}}>
            <h3 style={{marginBottom: 16, color: '#334155'}}>⚙️ Sozlamalar</h3>
            <div style={{background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                
                <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155'}}>Karta raqami (To'lovlar uchun)</div>
                <input className="input-field" placeholder="8600 1234 5678 9012" value={store.card_number} onChange={e=>setStore({...store, card_number: e.target.value})} />

                <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155', marginTop: 16}}>Yetkazib berish (1 km uchun narx so'mda)</div>
                <input className="input-field" type="number" placeholder="500" value={store.delivery_price} onChange={e=>setStore({...store, delivery_price: e.target.value})} />

                <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155', marginTop: 16}}>Do'kon / Sklad lokatsiyasi</div>
                <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
                    <input className="input-field" placeholder="Kenglik (Lat)" value={store.lat} onChange={e=>setStore({...store, lat: e.target.value})} style={{marginBottom: 0, flex: 1}}/>
                    <input className="input-field" placeholder="Uzunlik (Lon)" value={store.lon} onChange={e=>setStore({...store, lon: e.target.value})} style={{marginBottom: 0, flex: 1}}/>
                </div>
                <button onClick={getLocation} style={{width: '100%', padding: '12px', borderRadius: 12, background: '#f1f5f9', border: 'none', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16}}>
                    <MapPin size={18} /> Hozirgi joylashuvni olish
                </button>

                <button className="btn-primary" onClick={saveSettings} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                    <Save size={18} /> Saqlash
                </button>
            </div>
        </div>
    );
};

export const BannersTab = ({ storeId }) => {
    const [banners, setBanners] = useState([]);
    const [newImage, setNewImage] = useState('');
    const [newLink, setNewLink] = useState('');

    const loadBanners = async () => {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/banners?store_id=eq.${storeId}`, {
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
            });
            const data = await res.json();
            setBanners(Array.isArray(data) ? data : []);
        } catch(e) {}
    };

    useEffect(() => { if (storeId) loadBanners(); }, [storeId]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setNewImage(event.target.result);
        reader.readAsDataURL(file);
    };

    const addBanner = async () => {
        if (!newImage) return showAlert("Rasm yuklang");
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/banners`, {
                method: 'POST',
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
                body: JSON.stringify({ store_id: storeId, image_url: newImage, link_url: newLink || '' })
            });
            if (res.ok) {
                showAlert("Qo'shildi!");
                setNewImage(''); setNewLink('');
                loadBanners();
            } else showAlert("Xatolik!");
        } catch(e) {}
    };

    const deleteBanner = async (id) => {
        if (!window.confirm("O'chirasizmi?")) return;
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/banners?id=eq.${id}`, {
                method: 'DELETE',
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
            });
            loadBanners();
        } catch(e) {}
    };

    return (
        <div style={{padding: 16}}>
            <h3 style={{marginBottom: 16, color: '#334155'}}>🌟 Bannerlar (Stories)</h3>
            <div style={{background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 16}}>
                {newImage && <img src={newImage} alt="preview" style={{width: '100%', borderRadius: 12, marginBottom: 12, maxHeight: 150, objectFit: 'cover'}} />}
                <label style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#f1f5f9', borderRadius: 12, marginBottom: 12, cursor: 'pointer', color: '#64748b'}}>
                    <ImagePlus size={18} /> Rasm qo'shish
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} />
                </label>
                <input className="input-field" placeholder="Ssilka (bosganda qayerga o'tadi? Ixtiyoriy)" value={newLink} onChange={e=>setNewLink(e.target.value)} />
                <button className="btn-primary" onClick={addBanner}>Yuklash</button>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                {banners.map(b => (
                    <div key={b.id} style={{background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'relative'}}>
                        <img src={b.image_url} alt="banner" style={{width: '100%', height: 100, objectFit: 'cover'}} />
                        <button onClick={() => deleteBanner(b.id)} style={{position: 'absolute', top: 4, right: 4, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', padding: 6, cursor: 'pointer'}}>
                            <Trash2 size={14}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
