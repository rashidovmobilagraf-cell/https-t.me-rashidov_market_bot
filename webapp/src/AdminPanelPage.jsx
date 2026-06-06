import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Copy, Search, X, Camera, Package, ImagePlus } from 'lucide-react';
import { AnalyticsTab, PromoTab, BroadcastTab, SettingsTab, BannersTab } from './AdminTabs';
const showAlert = (msg) => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
    window.Telegram.WebApp.showAlert(msg);
  } else {
    alert(msg);
  }
};

const AdminPanelPage = ({ storeId }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  
  const [newProduct, setNewProduct] = useState({ 
    nameUz: '', nameRu: '', 
    price: '', discountToggle: false, discountPrice: '',
    category: '', unit: 'dona', image: '', stockQty: '', is_bestseller: false
  });
  
  const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

  useEffect(() => {
    let url = `${SUPABASE_URL}/rest/v1/products?select=*`;
    if (storeId) url += `&store_id=eq.${storeId}`;
    fetch(url, { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } })
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(e => { console.error(e); setItems([]); });
      
    let ordersUrl = `${SUPABASE_URL}/rest/v1/orders?select=*&order=date.desc`;
    if (storeId) ordersUrl += `&store_id=eq.${storeId}`;
    fetch(ordersUrl, { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } })
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(e => { console.error(e); setOrders([]); });
  }, [storeId]);

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoadingAuth(false);
      return;
    }
    fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}&select=owner_id`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        const ownerId = data[0].owner_id;
        if (tgUser?.id?.toString() === ownerId || tgUser?.id?.toString() === "7899711439") {
          setIsAdmin(true);
        }
      }
      setLoadingAuth(false);
    })
    .catch(() => setLoadingAuth(false));
  }, [storeId, tgUser?.id]);

  if (loadingAuth) {
    return <div style={{padding: 40, textAlign: 'center'}}>Tekshirilmoqda...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{padding: 40, textAlign: 'center', fontFamily: 'system-ui', color: '#ef4444'}}>
        <h2>Xatolik!</h2>
        <p>Boshqaruv paneliga kirish huquqi faqat do'kon egasi uchun.</p>
      </div>
    );
  }

  const handleStatusChange = async (orderId, newStatus, userId) => {
    try {
      const res = await fetch('https://webapp-kohl-kappa.vercel.app/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', orderId, newStatus, userId, storeId })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
        showAlert("Holat o'zgartirildi!");
      } else {
        showAlert("Xatolik yuz berdi");
      }
    } catch (e) {
      showAlert("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("O'chirasizmi?")) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, { 
          method: 'DELETE',
          headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        });
        if(res.ok) setItems(items.filter(p => p.id !== id));
        else showAlert("O'chirishda xatolik!");
      } catch (e) {
        showAlert("O'chirishda xatolik yuz berdi");
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const maxSize = 500;
        if (width > height && width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setNewProduct(prev => ({...prev, image: canvas.toDataURL('image/jpeg', 0.8)}));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openAdd = () => {
    setEditingId(null);
    setNewProduct({ nameUz: '', nameRu: '', price: '', discountToggle: false, discountPrice: '', category: '', unit: 'dona', image: '', stockQty: '', is_bestseller: false, variantsStr: '' });
    setShowAdd(true);
  };

  const openEdit = (p) => {
    let nUz = p.name || '', nRu = '';
    try {
        const j = JSON.parse(p.name);
        if(j && j.uz) { nUz = j.uz; nRu = j.ru || ''; }
    } catch(e) {}
    
    let cleanCat = p.category || '';
    let qtyStr = '', unitStr = 'dona';
    if (cleanCat.includes('||OUT_OF_STOCK')) { qtyStr = '0'; cleanCat = cleanCat.replace('||OUT_OF_STOCK', ''); }
    else if (cleanCat.includes('||QTY:')) {
        const parts = cleanCat.split('||QTY:');
        cleanCat = parts[0]; qtyStr = parts[1];
    }
    if (cleanCat.includes('||UNIT:')) {
        const parts = cleanCat.split('||UNIT:');
        cleanCat = parts[0]; unitStr = parts[1];
    }
    
    let vStr = '';
    if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
        vStr = p.variants.map(v => `${v.name}:${v.price}`).join(', ');
    }

    setEditingId(p.id);
    setNewProduct({
        nameUz: nUz, nameRu: nRu, price: p.price,
        discountToggle: false, discountPrice: '', // For now, not parsing discount from price string, just keeping basic
        category: cleanCat, unit: unitStr, stockQty: qtyStr, image: p.image_url || '',
        is_bestseller: !!p.is_bestseller,
        variantsStr: vStr
    });
    setShowAdd(true);
  };

  const handleSave = async () => {
    if(!newProduct.nameUz || !newProduct.price) return showAlert("O'zbekcha nom va narx kiritilishi shart!");
    
    const nameData = JSON.stringify({ uz: newProduct.nameUz, ru: newProduct.nameRu });
    let catData = newProduct.category;
    if (newProduct.unit && newProduct.unit !== 'dona') catData += `||UNIT:${newProduct.unit}`;
    if (newProduct.stockQty) catData += `||QTY:${newProduct.stockQty}`;
    
    let priceData = newProduct.price;
    if (newProduct.discountToggle && newProduct.discountPrice) {
        priceData = `${newProduct.discountPrice} so'm (Chegirma)`; // Quick hack for simple display, ideally store real price
    }

    let variantsData = [];
    if (newProduct.variantsStr) {
        try {
            variantsData = newProduct.variantsStr.split(',').map(s => {
                const [n, p] = s.split(':');
                if (n && p) return { name: n.trim(), price: parseInt(p.trim()) || 0 };
                return null;
            }).filter(Boolean);
        } catch(e) {}
    }

    const payload = { name: nameData, price: priceData, category: catData, image_url: newProduct.image, is_bestseller: !!newProduct.is_bestseller, variants: variantsData };
    if (storeId) payload.store_id = storeId;
    
    try {
      if (editingId) {
        await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${editingId}`, {
          method: 'PATCH',
          headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        setItems(items.map(i => i.id === editingId ? { ...i, ...payload } : i));
      } else {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
          method: 'POST',
          headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(res.ok && data && data.length > 0) setItems([...items, data[0]]);
        else return showAlert("Xatolik: " + JSON.stringify(data));
      }
      setShowAdd(false);
    } catch (e) {
      showAlert("Xatolik yuz berdi");
    }
  };

  const filteredItems = items.filter(p => {
      if(!searchQ) return true;
      let n = p.name || '';
      try{ const j=JSON.parse(p.name); if(j) n=j.uz+" "+j.ru; }catch(e){}
      return n.toLowerCase().includes(searchQ.toLowerCase());
  });

  return (
    <div className="content" style={{padding: 16, background: '#f8fafc', minHeight: '100vh', paddingBottom: 100}}>
      
      <div className="admin-tab-bar" style={{overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 10, display: 'flex', gap: 8}}>
        <button className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Analitika</button>
        <button className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>📦 Mahsulotlar</button>
        <button className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📝 Buyurtmalar</button>
        <button className={`admin-tab-btn ${activeTab === 'banners' ? 'active' : ''}`} onClick={() => setActiveTab('banners')}>🌟 Bannerlar</button>
        <button className={`admin-tab-btn ${activeTab === 'promo' ? 'active' : ''}`} onClick={() => setActiveTab('promo')}>🎟 Promokod</button>
        <button className={`admin-tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>📣 Rassilka</button>
        <button className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Sozlamalar</button>
      </div>

      {activeTab === 'analytics' && <AnalyticsTab orders={orders} />}
      {activeTab === 'banners' && <BannersTab storeId={storeId} />}
      {activeTab === 'promo' && <PromoTab storeId={storeId} />}
      {activeTab === 'broadcast' && <BroadcastTab storeId={storeId} />}
      {activeTab === 'settings' && <SettingsTab storeId={storeId} />}

      {activeTab === 'products' && (
        <>
          <div style={{display: 'flex', gap: 12, marginBottom: 16}}>
            <div style={{flex: 1, position: 'relative'}}>
              <Search size={18} style={{position: 'absolute', left: 12, top: 12, color: '#94a3b8'}} />
              <input 
                className="input-field" 
                placeholder="Qidiruv..." 
                value={searchQ} onChange={e => setSearchQ(e.target.value)} 
                style={{marginBottom: 0, paddingLeft: 40, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'}} 
              />
            </div>
            <button className="btn-primary" style={{width: 'auto', padding: '0 16px', borderRadius: 12, boxShadow: '0 4px 12px rgba(13, 148, 114, 0.3)'}} onClick={openAdd}>
              <Plus size={20} />
            </button>
          </div>

          <div style={{display: 'flex', flexDirection: 'column'}}>
            {filteredItems.map(p => {
              let dispName = p.name || '';
              try { const j = JSON.parse(p.name); if(j && j.uz) dispName = j.uz; } catch(e){}
              let c = p.category || '';
              let qStr = null;
              if (c.includes('||QTY:')) qStr = c.split('||QTY:')[1].split('||')[0];
              return (
                <div key={p.id} className="admin-card">
                  <img src={p.image_url || "https://picsum.photos/300"} alt={dispName} className="admin-card-img" />
                  <div className="admin-card-info">
                    <div className="admin-card-title">{dispName}</div>
                    <div className="admin-card-price">{p.price}</div>
                    {qStr && <div className="admin-card-stock">Zaxirada: {qStr} ta</div>}
                  </div>
                  <div className="admin-card-actions">
                    <button className="action-btn-mini edit" onClick={() => openEdit(p)}><Edit2 size={16} /></button>
                    <button className="action-btn-mini copy" onClick={() => {
                        openEdit(p);
                        setEditingId(null); // Remove id so it saves as new
                    }}><Copy size={16} /></button>
                    <button className="action-btn-mini delete" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && <div style={{textAlign: 'center', color: '#888', marginTop: 32}}>Mahsulot topilmadi</div>}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          {orders.map(o => (
            <div key={o.order_id} style={{background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                <span style={{fontWeight: 700, fontSize: 16}}>#{o.order_id}</span>
                <span style={{color: '#94a3b8', fontSize: 12}}>{new Date(o.date).toLocaleString('uz-UZ')}</span>
              </div>
              <div style={{marginBottom: 8, fontSize: 14, color: '#334155'}}>
                <b style={{color: '#000'}}>Tel:</b> {o.address?.phone || o.user_id}
                {o.delivery_time && <><br/><b style={{color: '#000'}}>Vaqt:</b> <span style={{color: '#eab308', fontWeight: 600}}>{o.delivery_time}</span></>}
              </div>
              <div style={{marginBottom: 12, fontSize: 13, color: '#475569', background: '#f8fafc', padding: 12, borderRadius: 12}}>
                {o.items?.map((i, idx) => {
                    let n = i.name || '';
                    try { const j = JSON.parse(i.name); if(j && j.uz) n = j.uz; } catch(e){}
                    return <div key={idx} style={{marginBottom: 4}}>• {n} <b style={{color:'#000'}}>x{i.quantity || i.qty}</b></div>
                })}
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{fontWeight: 700, color: 'var(--primary)', fontSize: 16}}>{(o.total || 0).toLocaleString()} so'm</span>
                <select value={o.status || 'Yangi'} onChange={e => handleStatusChange(o.order_id, e.target.value, o.user_id)} 
                  style={{padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: o.status==='Bajarildi'?'#dcfce7':(o.status==='Bekor qilingan'?'#fee2e2':'#fff'), color: o.status==='Bajarildi'?'#166534':(o.status==='Bekor qilingan'?'#991b1b':'#0f172a'), outline: 'none', fontWeight: 600}}>
                  <option value="Yangi">🟡 Yangi</option>
                  <option value="Yetkazilmoqda">🔵 Yo'lga</option>
                  <option value="Bajarildi">🟢 Bajarildi</option>
                  <option value="Bekor qilingan">🔴 Bekor</option>
                </select>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div style={{textAlign: 'center', color: '#888', marginTop: 32}}>Buyurtmalar yo'q</div>}
        </div>
      )}

      {/* Bottom Sheet Modal for Add/Edit */}
      {showAdd && (
        <div className="bottom-sheet-overlay" onClick={(e) => { if(e.target.className === 'bottom-sheet-overlay') setShowAdd(false); }}>
          <div className="bottom-sheet-content">
            <div className="sheet-header">
              <div className="sheet-title">{editingId ? "Tahrirlash" : "Mahsulot qo'shish"}</div>
              <button className="icon-btn" onClick={() => setShowAdd(false)} style={{background: '#f1f5f9', color: '#64748b', padding: 6, borderRadius: '50%'}}>
                <X size={20} />
              </button>
            </div>

            <label className="premium-image-upload">
              {newProduct.image ? (
                <div className="premium-image-preview-container">
                  <img src={newProduct.image} alt="preview" className="premium-image-preview" />
                  <div className="premium-image-overlay">
                    <Camera size={24} color="#fff" />
                    <span>Boshqa rasm tanlash</span>
                  </div>
                </div>
              ) : (
                <div className="premium-image-placeholder">
                  <div className="premium-image-icon-wrapper">
                    <ImagePlus size={32} color="var(--primary)" />
                  </div>
                  <span className="premium-image-title">Rasm yuklash (Bosish)</span>
                  <span className="premium-image-subtitle">Mahsulot uchun aniq va sifatli rasm tanlang</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} />
            </label>

            <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155'}}>Nomi (UZ) *</div>
            <input className="input-field" placeholder="Masalan: Cola 1.5L" value={newProduct.nameUz} onChange={e => setNewProduct({...newProduct, nameUz: e.target.value})} />
            
            <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155'}}>Nomi (RU)</div>
            <input className="input-field" placeholder="Пример: Кола 1.5Л" value={newProduct.nameRu} onChange={e => setNewProduct({...newProduct, nameRu: e.target.value})} />

            <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155'}}>Kategoriya</div>
            <input className="input-field" placeholder="Masalan: Ichimliklar" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
            <div style={{display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginTop: 8}}>
              {["SHIRINLIKLAR", "O'YINCHOQLAR", "XO'JALIK MOLLARI", "ICHIMLIKLAR", "SUT MAHSULOTLARI", "GO'SHT MAHSULOTLARI", "UN MAHSULOTLARI", "MEVA-SABZAVOTLAR", "PISHIRIKLAR"].map(c => (
                <div key={c} onClick={() => setNewProduct({...newProduct, category: c})} style={{padding: '6px 14px', background: newProduct.category === c ? 'var(--primary)' : '#f1f5f9', color: newProduct.category === c ? '#fff' : '#475569', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'}}>
                  {c}
                </div>
              ))}
            </div>

            <div style={{display: 'flex', gap: 12}}>
                <div style={{flex: 1}}>
                    <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155'}}>Narxi (so'm) *</div>
                    <input className="input-field" type="text" inputMode="numeric" placeholder="25000" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                </div>
                <div style={{flex: 1}}>
                    <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155'}}>O'lchov</div>
                    <select className="input-field" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}>
                        <option value="dona">Dona</option>
                        <option value="kg">Kg</option>
                        <option value="litr">Litr</option>
                        <option value="pors">Porsiya</option>
                    </select>
                </div>
            </div>

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12}}>
                <span style={{fontWeight: 600, color: '#334155'}}>Chegirma bormi?</span>
                <input type="checkbox" checked={newProduct.discountToggle} onChange={e => setNewProduct({...newProduct, discountToggle: e.target.checked})} style={{width: 20, height: 20, accentColor: 'var(--primary)'}} />
            </div>

            {newProduct.discountToggle && (
                <>
                  <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#ef4444'}}>Chegirmadagi narxi (so'm)</div>
                  <input className="input-field" type="text" inputMode="numeric" placeholder="20000" value={newProduct.discountPrice} onChange={e => setNewProduct({...newProduct, discountPrice: e.target.value})} style={{borderColor: '#fca5a5'}} />
                </>
            )}

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12}}>
                <span style={{fontWeight: 600, color: '#334155'}}>Bestseller (Tavsiya etamiz) ⭐️</span>
                <input type="checkbox" checked={newProduct.is_bestseller} onChange={e => setNewProduct({...newProduct, is_bestseller: e.target.checked})} style={{width: 20, height: 20, accentColor: 'var(--primary)'}} />
            </div>

            <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155'}}>Variantlar (ixtiyoriy)</div>
            <input className="input-field" placeholder="Masalan: S:20000, M:25000" value={newProduct.variantsStr} onChange={e => setNewProduct({...newProduct, variantsStr: e.target.value})} />
            <div style={{fontSize: 12, color: '#64748b', marginTop: -8, marginBottom: 12}}>Vergul bilan ajrating. Format: Nomi:Narxi</div>

            <div style={{fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#334155'}}>Zaxirada mavjud (dona)</div>
            <input className="input-field" type="text" inputMode="numeric" placeholder="Masalan: 100. Bo'sh qolsa cheksiz" value={newProduct.stockQty} onChange={e => setNewProduct({...newProduct, stockQty: e.target.value})} />

            <button className="btn-primary" onClick={handleSave} style={{marginTop: 8, boxShadow: '0 4px 12px rgba(13, 148, 114, 0.3)'}}>
              Saqlash
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanelPage;
