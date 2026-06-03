import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { User, Search, ShoppingCart, Heart, Store, Grid, Plus, Minus, X, Trash2, ArrowLeft, Share2, MapPin, Truck, Wallet, FileText, ChevronRight, MessageSquare, Package, CreditCard, Edit2, Copy, Camera } from 'lucide-react'
import AdminPanelPage from './AdminPanelPage'
const showAlert = (msg) => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
    window.Telegram.WebApp.showAlert(msg);
  } else {
    alert(msg);
  }
};

const tDict = {
  uz: {
    vitrina: "Vitrina", katalog: "Katalog", saralanganlar: "Saralanganlar", savat: "Savat", akkaunt: "Akkaunt",
    info: "Mening ma'lumotlarim", orders: "Mening buyurtmalarim", support: "Shikoyatlar va takliflar",
    lang: "Tizim tili", uzb: "O'zbekcha", rus: "Ruscha"
  },
  ru: {
    vitrina: "Витрина", katalog: "Каталог", saralanganlar: "Избранное", savat: "Корзина", akkaunt: "Аккаунт",
    info: "Мои данные", orders: "Мои заказы", support: "Жалобы и предложения",
    lang: "Язык системы", uzb: "Узбекский", rus: "Русский"
  }
};

// --- Header ---
const Header = ({ title, subtitle, showBack = false, onBack, onProfile }) => {
  return (
    <header className="header">
      <div className="header-left">
        {showBack && <button className="icon-btn" onClick={onBack}><ArrowLeft size={24} /></button>}
      </div>
      <div className="header-center">
        {title === "RM" ? (
          <div className="brand-logo">
            <Store size={20} className="brand-icon" />
            <span className="brand-text">Rashidov <span className="brand-highlight">Market</span></span>
          </div>
        ) : (
          <span className="header-title">{title}</span>
        )}
        {subtitle && <span className="header-subtitle">{subtitle}</span>}
      </div>
      <div className="header-right">
        {!showBack && (
          <>
            <button className="icon-btn" onClick={onProfile}><User size={22} /></button>
            <button className="icon-btn"><Search size={22} /></button>
          </>
        )}
      </div>
    </header>
  );
};

// --- Bottom Nav ---
const BottomNav = ({ cartCount, favCount, t, lang }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="b-nav">
      <div className={`b-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
        <Store size={22} fill={location.pathname === '/' ? "currentColor" : "none"} />
        <span>{t('vitrina', lang)}</span>
      </div>
      <div className={`b-item ${location.pathname === '/menu' ? 'active' : ''}`} onClick={() => navigate('/menu')}>
        <Grid size={22} fill={location.pathname === '/menu' ? "currentColor" : "none"} />
        <span>{t('katalog', lang)}</span>
      </div>
      <div className={`b-item ${location.pathname === '/favorites' ? 'active' : ''}`} onClick={() => navigate('/favorites')}>
        <Heart size={22} fill={location.pathname === '/favorites' ? "currentColor" : "none"} />
        {favCount > 0 && <span className="b-badge" style={{background: 'transparent', color: '#ef4444'}}>•</span>}
        <span>{t('saralanganlar', lang)}</span>
      </div>
      <div className={`b-item ${location.pathname === '/cart' ? 'active' : ''}`} onClick={() => navigate('/cart')}>
        <ShoppingCart size={22} fill={location.pathname === '/cart' ? "currentColor" : "none"} />
        {cartCount > 0 && <span className="b-badge">{cartCount}</span>}
        <span>{t('savat', lang)}</span>
      </div>
    </div>
  );
};

const ProductCard = ({ p, favs, toggleFav, onImageClick }) => {
  const isFav = favs.has(p.id);
  let isOut = false;
  let catName = p.category || '';
  let stockStr = '';
  if (catName.includes('||OUT_OF_STOCK')) {
    isOut = true;
    catName = catName.replace('||OUT_OF_STOCK', '');
  } else if (catName.includes('||QTY:')) {
    const parts = catName.split('||QTY:');
    catName = parts[0];
    stockStr = parts[1];
    if (stockStr === '0') isOut = true;
  }

  return (
    <div className="p-card" onClick={() => !isOut && onImageClick(p)} style={{opacity: isOut ? 0.6 : 1, position: 'relative'}}>
      <div className="p-img-wrap">
        <img src={p.image || `https://picsum.photos/seed/${p.name}/300`} alt={p.name} className="p-img" />
        {isOut && <div style={{position: 'absolute', top: 8, left: 8, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 6}}>QOLMAGAN</div>}
        <button className={`p-fav ${isFav ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}>
          <Heart size={16} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-info">
        <div className="p-title">{p.name}</div>
        <div className="p-unit" style={{display:'flex', justifyContent:'space-between'}}>
          <span>{catName || 'sht'}</span>
          {stockStr && !isOut && <span style={{color:'#059669'}}>Zaxira: {stockStr}</span>}
        </div>
        <div className="p-price">{p.price} so'm</div>
      </div>
    </div>
  );
};

// --- Product Modal ---
const ProductModal = ({ product, onClose, cart, setCart, favs, toggleFav }) => {
  if (!product) return null;
  const navigate = useNavigate();
  const qty = cart[product.id]?.quantity || 0;
  const isFav = favs.has(product.id);

  let isOut = false;
  let stockStr = '';
  let catName = product.category || '';
  if (catName.includes('||OUT_OF_STOCK')) {
    isOut = true;
  } else if (catName.includes('||QTY:')) {
    const parts = catName.split('||QTY:');
    stockStr = parts[1];
    if (stockStr === '0') isOut = true;
  }
  const maxQty = stockStr ? parseInt(stockStr, 10) : Infinity;

  const handleAdd = () => {
    if (qty >= maxQty) return;
    setCart(prev => ({ ...prev, [product.id]: { product, quantity: (prev[product.id]?.quantity || 0) + 1 } }));
  };
  const handleDecrease = () => setCart(prev => {
    if (prev[product.id].quantity === 1) {
      const newCart = { ...prev };
      delete newCart[product.id];
      return newCart;
    }
    return { ...prev, [product.id]: { ...prev[product.id], quantity: prev[product.id].quantity - 1 } };
  });

  return (
    <div className="modal-page">
      <div className="m-header-icons">
        <div className="m-header-left">
          <button className="m-icon-btn" onClick={onClose}><ArrowLeft size={20} /></button>
        </div>
        <div className="m-header-right">
          <button className="m-icon-btn" onClick={() => toggleFav(product.id)}>
            <Heart size={20} color={isFav ? "#ef4444" : "#333"} fill={isFav ? "#ef4444" : "none"} />
          </button>
          <button className="m-icon-btn"><Share2 size={20} /></button>
          <button className="m-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
      </div>
      <img src={product.image || `https://picsum.photos/seed/${product.name}/500`} alt={product.name} className="m-img" />
      
      <div className="m-info">
        <h2 className="m-title">{product.name}</h2>
        <div className="m-stock">{stockStr ? `Mavjud: ${stockStr} ta` : 'Mavjud'}</div>
        <div className="m-price">{product.price} so'm</div>
        
        <div className="m-section-title">Variantlar</div>
        <div className="m-variant-pill">{product.name}</div>
        
        <div className="m-desc-title">Tavsif</div>
        <div className="m-desc">Tavsif kiritilmagan.</div>
      </div>
      
      <div className="bottom-bar">
        {qty > 0 ? (
          <div className="m-controls-row">
            <div className="qty-stepper">
              <button className="qty-btn" onClick={handleDecrease}><Minus size={20}/></button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={handleAdd}><Plus size={20}/></button>
            </div>
            <button className="btn-primary" onClick={() => { onClose(); navigate('/cart'); }} style={{flex: 1}}>
              Savatga o'tish
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={handleAdd}>Savatga qo'shish</button>
        )}
      </div>
    </div>
  );
};

// --- Pages ---

const HomePage = ({ products, favs, toggleFav, onSelectProduct }) => {
  const categories = Array.from(new Set(products.map(p => {
    let c = p.category || "Boshqa";
    if (c.includes('||QTY:')) c = c.split('||QTY:')[0];
    return c.replace('||OUT_OF_STOCK', '');
  })));
  
  return (
    <div className="content">
      {categories.map(cat => {
        const catProducts = products.filter(p => {
          let c = p.category || "Boshqa";
          if (c.includes('||QTY:')) c = c.split('||QTY:')[0];
          return c.replace('||OUT_OF_STOCK', '') === cat;
        });
        return (
          <div key={cat} className="section">
            <div className="section-title">{cat}</div>
            <div className="grid">
              {catProducts.map(p => (
                <ProductCard key={p.id} p={p} favs={favs} toggleFav={toggleFav} onImageClick={onSelectProduct} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  );
};

const MenuPage = ({ products, onSelectProduct, favs, toggleFav }) => {
  // Using the same layout for Menu to show items
  return <HomePage products={products} favs={favs} toggleFav={toggleFav} onSelectProduct={onSelectProduct} />;
};

const FavoritesPage = ({ products, favs, toggleFav, onSelectProduct }) => {
  const favProducts = products.filter(p => favs.has(p.id));
  return (
    <div className="content">
      {favProducts.length === 0 ? (
        <div className="empty">
          <Heart size={64} className="empty-icon" />
          <div className="empty-title">Saralanganlar bo'sh</div>
        </div>
      ) : (
        <div className="section">
          <div className="grid">
            {favProducts.map(p => (
              <ProductCard key={p.id} p={p} favs={favs} toggleFav={toggleFav} onImageClick={onSelectProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CartPage = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const cartItems = Object.values(cart);

  const increase = (id) => setCart(prev => ({ ...prev, [id]: { ...prev[id], quantity: prev[id].quantity + 1 } }));
  const decrease = (id) => setCart(prev => {
    if (prev[id].quantity === 1) {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    }
    return { ...prev, [id]: { ...prev[id], quantity: prev[id].quantity - 1 } };
  });
  const remove = (id) => setCart(prev => { const newCart = { ...prev }; delete newCart[id]; return newCart; });

  return (
    <div className="content" style={{paddingTop: 8, paddingBottom: 100}}>
      {cartItems.length === 0 ? (
        <div className="empty">
          <ShoppingCart size={64} className="empty-icon" />
          <div className="empty-title">Savat bo'sh</div>
          <div className="empty-sub">Katalogdan mahsulot qo'shing</div>
        </div>
      ) : (
        <div className="cart-list">
          {cartItems.map((item, idx) => (
            <div key={idx} className="c-item">
              <div className="c-item-row">
                <img src={item.product.image || `https://picsum.photos/seed/${item.product.name}/100`} alt={item.product.name} className="c-img" />
                <div className="c-info">
                  <div className="c-title">{item.product.name}</div>
                  <div className="c-variant">Variant: {item.product.name}</div>
                  <div className="c-price">{item.product.price} so'm</div>
                </div>
              </div>
              <div className="c-actions">
                <div className="qty-stepper" style={{width: 100, height: 36}}>
                  <button className="qty-btn" onClick={() => decrease(item.product.id)}><Minus size={16}/></button>
                  <span className="qty-val" style={{fontSize: 14}}>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => increase(item.product.id)}><Plus size={16}/></button>
                </div>
                <button className="icon-btn" onClick={() => remove(item.product.id)} style={{color: '#9ca3af'}}><Trash2 size={20} /></button>
              </div>
            </div>
          ))}
          <div className="section">
            <div className="section-title" style={{fontSize: 14}}>Buyurtmaga izoh</div>
            <textarea className="input-field" placeholder="Buyurtma uchun istaklar..." rows="2" style={{marginBottom: 0}} value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
          </div>
        </div>
      )}
      
      {cartItems.length > 0 && (
        <div className="bottom-bar">
          <button className="btn-primary" onClick={() => navigate('/checkout', { state: { comment } })}>Keyingi <ArrowRight size={18} style={{marginLeft: 8}} /></button>
        </div>
      )}
    </div>
  );
};

const ArrowRight = ({ size, style }) => <ChevronRight size={size} style={style} />;

const CheckoutPage = ({ cart, setCart }) => {
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [paymentType, setPaymentType] = useState('cash');
  const [address, setAddress] = useState({ house: "", apt: "", code: "", phone: "+998" });
  
  const location = useLocation();
  const comment = location.state?.comment || "";
  
  const cartItems = Object.values(cart);
  const itemsTotal = cartItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.product.price)), 0);
  const deliveryFee = deliveryType === 'delivery' ? 1000 : 0;
  const total = itemsTotal + deliveryFee;

  const checkout = () => {
    if (!window.Telegram?.WebApp) {
      showAlert("Faqat Telegram ichida buyurtma berish mumkin!");
      return;
    }
    window.Telegram.WebApp.sendData(JSON.stringify({
        action: 'checkout',
        items: cartItems.map(i => ({id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity})),
        total: total,
        deliveryType: deliveryType,
        paymentType: paymentType,
        address: address,
        comment: comment
      }));
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAddress({ ...address, house: `Lokatsiya (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`, lat: pos.coords.latitude, lon: pos.coords.longitude });
          showAlert("Manzil lokatsiya orqali aniqlandi!");
        },
        (err) => {
          showAlert("Lokatsiyani olishning iloji bo'lmadi. Sozlamalardan ruxsat bering yoki qo'lda kiriting.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      showAlert("Brauzeringiz lokatsiyani qo'llab-quvvatlamaydi.");
    }
  };

  return (
    <div className="content cart-page-bg" style={{paddingBottom: 100}}>
      <div className="checkout-section">
        <div className="checkout-title">Buyurtma turi</div>
        <div className="segmented-control">
          <button className={`seg-btn ${deliveryType === 'delivery' ? 'active' : ''}`} onClick={() => setDeliveryType('delivery')}>
            <Truck size={16} /> Yetkazib berish
          </button>
          <button className={`seg-btn ${deliveryType === 'pickup' ? 'active' : ''}`} onClick={() => setDeliveryType('pickup')}>
            <MapPin size={16} /> O'zingiz olib ketish
          </button>
        </div>
        
        {deliveryType === 'delivery' ? (
          <>
            <div className="checkout-title" style={{marginTop: 16}}>Manzil</div>
            <button className="btn-primary" onClick={handleLocation} style={{background: 'var(--primary)', color: '#fff', marginBottom: 12, fontSize: 14, padding: 12}}>+ Yangi manzil qo'shish (Lokatsiya)</button>
            <div className="checkout-title" style={{marginTop: 16, fontSize: 13, color: 'var(--text-muted)'}}>Manzil tafsilotlari</div>
            <div style={{display: 'flex', gap: 12}}>
              <input type="text" className="input-field" placeholder="Uy" value={address.house} onChange={e => setAddress({...address, house: e.target.value})} />
              <input type="text" className="input-field" placeholder="Kvartira" value={address.apt} onChange={e => setAddress({...address, apt: e.target.value})} />
            </div>
            <input type="text" className="input-field" placeholder="Eshik kodi / domofon" value={address.code} onChange={e => setAddress({...address, code: e.target.value})} />
          </>
        ) : (
          <div style={{color: 'var(--text-muted)', fontSize: 14, margin: '16px 0'}}>
            Samovozda manzil kiritish shart emas.
          </div>
        )}
      </div>

      <div className="checkout-section">
        <div className="checkout-title">Telefon *</div>
        <input type="tel" className="input-field" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} />
      </div>

      <div className="checkout-section">
        <div className="checkout-title">To'lov usuli</div>
        <div className="segmented-control" style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
          <button className={`seg-btn ${paymentType === 'cash' ? 'active' : ''}`} onClick={() => setPaymentType('cash')} style={{flex: '1 1 45%'}}>
            <Wallet size={16} /> Naqd pul
          </button>
          <button className={`seg-btn ${paymentType === 'click' ? 'active' : ''}`} onClick={() => setPaymentType('click')} style={{flex: '1 1 45%'}}>
            <CreditCard size={16} /> Click
          </button>
          <button className={`seg-btn ${paymentType === 'payme' ? 'active' : ''}`} onClick={() => setPaymentType('payme')} style={{flex: '1 1 45%'}}>
            <CreditCard size={16} /> Payme
          </button>
        </div>
        
        <div style={{marginTop: 16}}>
          <div className="summary-row">
            <span style={{display: 'flex', alignItems: 'center', gap: 8}}><FileText size={16} color="var(--text-muted)"/> Mahsulotlar:</span>
            <span>{itemsTotal.toLocaleString()} so'm</span>
          </div>
          <div className="summary-row">
            <span style={{display: 'flex', alignItems: 'center', gap: 8}}><Truck size={16} color="var(--text-muted)"/> Xizmat:</span>
            <span>{deliveryFee.toLocaleString()} so'm</span>
          </div>
          <div className="summary-total">
            <span>Jami:</span>
            <span style={{color: 'var(--primary)'}}>{total.toLocaleString()} so'm</span>
          </div>
        </div>
      </div>

      <div className="bottom-bar" style={{display: 'flex', gap: 12}}>
        <button className="btn-primary" style={{background: '#f0f0f0', color: '#333', flex: 0.5}} onClick={() => window.history.back()}>
          ← Orqaga
        </button>
        <button className="btn-primary" style={{flex: 1}} onClick={checkout}>
          Buyurtma berish
        </button>
      </div>
    </div>
  );
};

const ProfileInfoPage = () => (
  <div className="content" style={{padding: 16}}>
    <input type="text" className="input-field" defaultValue="Ivan" placeholder="Ism" />
    <input type="text" className="input-field" defaultValue="Ivanov" placeholder="Familiya" />
    <input type="tel" className="input-field" defaultValue="+998900000000" placeholder="Telefon" />
    <button className="btn-primary" onClick={() => window.history.back()} style={{marginTop: 16}}>Saqlash</button>
  </div>
);

const ProfileOrdersPage = () => (
  <div className="content">
    <div className="empty">
      <Package size={64} className="empty-icon" />
      <div className="empty-title">Buyurtmalar yo'q</div>
      <div className="empty-sub">Hali hech narsa xarid qilmadingiz</div>
    </div>
  </div>
);

const ProfileSupportPage = () => {
  const [msg, setMsg] = useState("");
  return (
    <div className="content" style={{padding: 16}}>
      <textarea 
        className="input-field" 
        placeholder="Xabaringizni yozing..." 
        rows="5" 
        value={msg} 
        onChange={(e) => setMsg(e.target.value)}
      ></textarea>
      <button className="btn-primary" onClick={() => { 
        if(!msg.trim()) return;
        showAlert("Xabar yuborildi!"); 
        window.history.back(); 
      }}>Yuborish</button>
    </div>
  );
};

const ProfilePage = ({ lang, setLang, t }) => {
  const navigate = useNavigate();
  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 65px)', background: '#f5f5f5', paddingBottom: 0 }}>
      <div className="profile-menu" style={{marginTop: 0, borderBottom: '1px solid var(--border)', borderRadius: 0, boxShadow: 'none'}}>
        <div className="profile-item" onClick={() => navigate('/profile/info')}>
          <User size={20} />
          <span style={{color: '#000'}}>{t('info', lang)}</span>
          <ChevronRight size={20} color="#cbd5e1" />
        </div>
        <div className="profile-item" onClick={() => navigate('/profile/orders')}>
          <Package size={20} />
          <span style={{color: '#000'}}>{t('orders', lang)}</span>
          <ChevronRight size={20} color="#cbd5e1" />
        </div>
        <div className="profile-item" onClick={() => navigate('/profile/support')}>
          <MessageSquare size={20} />
          <span style={{color: '#000'}}>{t('support', lang)}</span>
          <ChevronRight size={20} color="#cbd5e1" />
        </div>
      </div>
      
      <div style={{padding: '24px 16px 8px', fontSize: 13, fontWeight: 700, color: '#000'}}>{t('lang', lang)}</div>
      <div style={{padding: '0 16px', display: 'flex', gap: 12}}>
        <div 
          onClick={() => setLang('uz')} 
          style={{
            flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: lang === 'uz' ? 'rgba(13, 148, 114, 0.05)' : '#fff', 
            border: lang === 'uz' ? '1px solid var(--primary)' : '1px solid var(--border)',
            color: lang === 'uz' ? 'var(--primary)' : '#333'
          }}
        >
          <span style={{fontSize: 11, textTransform: 'uppercase', color: lang === 'uz' ? 'var(--primary)' : 'var(--text-muted)'}}>uz</span>
          <span style={{fontSize: 15, fontWeight: 500}}>O'zbekcha</span>
        </div>
        <div 
          onClick={() => setLang('ru')} 
          style={{
            flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: lang === 'ru' ? 'rgba(13, 148, 114, 0.05)' : '#fff', 
            border: lang === 'ru' ? '1px solid var(--primary)' : '1px solid var(--border)',
            color: lang === 'ru' ? 'var(--primary)' : '#333'
          }}
        >
          <span style={{fontSize: 11, textTransform: 'uppercase', color: lang === 'ru' ? 'var(--primary)' : 'var(--text-muted)'}}>ru</span>
          <span style={{fontSize: 15, fontWeight: 500}}>Русский</span>
        </div>
      </div>
      
      <div style={{flex: 1}}></div>
      <div style={{padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13}}>
        <div style={{textTransform: 'uppercase', marginBottom: 8, fontWeight: 600}}>Do'kon operatori</div>
        <div style={{marginBottom: 4}}>Operator username: <span style={{color: '#333'}}>@fuudmarket</span></div>
        <div>Operator telefoni: <span style={{color: '#333'}}>+998904644353</span></div>
      </div>
    </div>
  );
};




export default function App() {

  const [lang, setLang] = useState(localStorage.getItem('lang') || 'uz');
  const [cart, setCart] = useState({});
  const [favs, setFavs] = useState(new Set());
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key, l) => tDict[l || lang]?.[key] || key;

  const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

  // Multi-tenant: get store_id from URL
  const queryParams = new URLSearchParams(location.search);
  const storeId = queryParams.get('store_id');
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    let url = `${SUPABASE_URL}/rest/v1/products?select=*`;
    if (storeId) url += `&store_id=eq.${storeId}`;
    
    fetch(url, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    })
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Error fetching products:", err));

    if (storeId) {
      fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${storeId}&select=*`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
           const store = data[0];
           setStoreInfo(store);
           // Apply dynamic theme color
           if (store.theme_color) {
             document.documentElement.style.setProperty('--primary', store.theme_color);
           }
        }
      });
    }
  }, [storeId]);

  const toggleFav = (id) => {
    setFavs(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(id)) newFavs.delete(id); else newFavs.add(id);
      return newFavs;
    });
  };

  
  const getTitle = () => {
    if (location.pathname === '/admin-panel') return null;

    if (location.pathname === '/cart' || location.pathname === '/checkout') return null;
    if (location.pathname === '/profile') return t('akkaunt', lang);
    if (location.pathname === '/profile/info') return t('info', lang);
    if (location.pathname === '/profile/orders') return t('orders', lang);
    if (location.pathname === '/profile/support') return t('support', lang);
    return storeInfo ? storeInfo.store_name : "Market";
  };
  const getSubtitle = () => {
    return null;
  };

  const isHomeOrMenu = location.pathname === '/' || location.pathname === '/menu' || location.pathname === '/favorites';
  const showBottomNav = isHomeOrMenu;

  return (
    <div className="app">
      
      {location.pathname !== '/checkout' && location.pathname !== '/cart' && location.pathname !== '/admin-panel' && (

        <Header 
          title={getTitle()} 
          subtitle={getSubtitle()} 
          showBack={location.pathname.startsWith('/profile')} 
          onBack={() => navigate(-1)} 
          onProfile={() => navigate('/profile')} 
        />
      )}
      {location.pathname === '/cart' && <Header title="Savat" showBack={true} onBack={() => navigate(-1)} />}
      {location.pathname === '/checkout' && <Header title="RM" showBack={true} onBack={() => navigate(-1)} />}
      
      <Routes>
        <Route path="/admin-panel" element={<AdminPanelPage storeId={storeId} />} />
        <Route path="/" element={<HomePage products={products} favs={favs} toggleFav={toggleFav} onSelectProduct={setSelectedProduct} />} />
        <Route path="/menu" element={<MenuPage products={products} favs={favs} toggleFav={toggleFav} onSelectProduct={setSelectedProduct} />} />
        <Route path="/favorites" element={<FavoritesPage products={products} favs={favs} toggleFav={toggleFav} onSelectProduct={setSelectedProduct} />} />
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
        <Route path="/checkout" element={<CheckoutPage cart={cart} setCart={setCart} />} />
        <Route path="/profile" element={<ProfilePage lang={lang} setLang={setLang} t={t} />} />
        <Route path="/profile/info" element={<ProfileInfoPage />} />
        <Route path="/profile/orders" element={<ProfileOrdersPage />} />
        <Route path="/profile/support" element={<ProfileSupportPage />} />
      </Routes>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} cart={cart} setCart={setCart} favs={favs} toggleFav={toggleFav} />
      
      {showBottomNav && <BottomNav cartCount={Object.values(cart).reduce((s, i) => s + i.quantity, 0)} favCount={favs.size} t={t} lang={lang} />}
    </div>
  )
}
