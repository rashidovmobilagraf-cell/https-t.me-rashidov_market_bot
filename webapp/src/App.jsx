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
        {title === "RM" || title === "YONMA YON MARKET" ? (
          <div className="brand-logo-custom">
            <div className="brand-y-icon">Y</div>
            <div className="brand-text-col">
               <span className="brand-text-main">YONMA YON</span>
               <span className="brand-text-sub">M A R K E T</span>
            </div>
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
        <img src={p.image_url || `https://picsum.photos/seed/${p.name}/300`} alt={p.name} className="p-img" />
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

const ProductModal = ({ product, allProducts, onSelectProduct, onClose, cart, setCart, favs, toggleFav }) => {
  const [variantIdx, setVariantIdx] = useState(0);
  if (!product) return null;
  const navigate = useNavigate();
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

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const currentVariant = hasVariants ? variants[variantIdx] : null;
  const currentPrice = hasVariants ? currentVariant.price : parseInt(product.price?.toString().replace(/\D/g, '') || 0);
  const cartKey = hasVariants ? `${product.id}_${variantIdx}` : product.id;
  
  const qty = cart[cartKey]?.quantity || 0;

  const handleAdd = () => {
    if (qty >= maxQty) return;
    setCart(prev => ({ ...prev, [cartKey]: { product, variant: currentVariant, quantity: (prev[cartKey]?.quantity || 0) + 1, cartKey, price: currentPrice } }));
  };
  const handleDecrease = () => setCart(prev => {
    if (prev[cartKey].quantity === 1) {
      const newCart = { ...prev };
      delete newCart[cartKey];
      return newCart;
    }
    return { ...prev, [cartKey]: { ...prev[cartKey], quantity: prev[cartKey].quantity - 1 } };
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
      <img src={product.image_url || `https://picsum.photos/seed/${product.name}/500`} alt={product.name} className="m-img" />
      
      <div className="m-info">
        <h2 className="m-title">{product.name}</h2>
        <div className="m-stock">{stockStr ? `Mavjud: ${stockStr} ta` : 'Mavjud'}</div>
        <div className="m-price">{(currentPrice || 0).toLocaleString()} so'm</div>
        
        {hasVariants && (
            <>
                <div className="m-section-title" style={{marginTop: 16}}>Variantlar</div>
                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                    {variants.map((v, i) => (
                        <div key={i} onClick={() => setVariantIdx(i)} style={{padding: '8px 16px', borderRadius: 20, border: variantIdx === i ? '2px solid var(--primary)' : '1px solid #cbd5e1', background: variantIdx === i ? 'rgba(13, 148, 114, 0.05)' : '#fff', color: variantIdx === i ? 'var(--primary)' : '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer'}}>
                            {v.name}
                        </div>
                    ))}
                </div>
            </>
        )}
        
        <div className="m-desc-title" style={{marginTop: 16}}>Tavsif</div>
        <div className="m-desc">Kategoriya: {catName}</div>
        
        {allProducts && allProducts.length > 0 && (
            <div style={{marginTop: 24, paddingBottom: 16}}>
                <div style={{fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#334155'}}>O'xshash tovarlar</div>
                <div style={{display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    {allProducts.filter(p => p.id !== product.id && (p.category === product.category || Math.random() > 0.5)).slice(0, 5).map(p => (
                        <div key={p.id} style={{minWidth: 120, width: 120}}>
                            <ProductCard p={p} favs={favs} toggleFav={toggleFav} onImageClick={onSelectProduct} />
                        </div>
                    ))}
                </div>
            </div>
        )}
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

const HomePage = ({ products, banners, favs, toggleFav, onSelectProduct }) => {
  const categories = Array.from(new Set(products.map(p => {
    let c = p.category || "Boshqa";
    if (c.includes('||QTY:')) c = c.split('||QTY:')[0];
    return c.replace('||OUT_OF_STOCK', '');
  })));
  
  const bestsellers = products.filter(p => p.is_bestseller);

  return (
    <div className="content">
      {banners && banners.length > 0 && (
          <div style={{display: 'flex', overflowX: 'auto', gap: 12, padding: '16px 16px 0', scrollbarWidth: 'none'}}>
              {banners.map(b => (
                  <div key={b.id} style={{minWidth: 280, width: 280, height: 140, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} onClick={() => b.link_url && (window.location.href = b.link_url)}>
                      <img src={b.image_url} alt="banner" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  </div>
              ))}
          </div>
      )}
      {bestsellers.length > 0 && (
        <div className="section" style={{marginBottom: 8}}>
            <div className="section-title">⭐️ Tavsiya etamiz</div>
            <div style={{display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {bestsellers.map(p => (
                   <div key={p.id} style={{minWidth: 140, width: 140}}>
                      <ProductCard p={p} favs={favs} toggleFav={toggleFav} onImageClick={onSelectProduct} />
                   </div>
                ))}
            </div>
        </div>
      )}
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
  const cartItems = Object.entries(cart);

  const increase = (cartKey) => setCart(prev => ({ ...prev, [cartKey]: { ...prev[cartKey], quantity: prev[cartKey].quantity + 1 } }));
  const decrease = (cartKey) => setCart(prev => {
    if (prev[cartKey].quantity === 1) {
      const newCart = { ...prev };
      delete newCart[cartKey];
      return newCart;
    }
    return { ...prev, [cartKey]: { ...prev[cartKey], quantity: prev[cartKey].quantity - 1 } };
  });
  const remove = (cartKey) => setCart(prev => { const newCart = { ...prev }; delete newCart[cartKey]; return newCart; });

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
          {cartItems.map(([cartKey, item]) => (
            <div key={cartKey} className="c-item">
              <div className="c-item-row">
                <img src={item.product.image_url || `https://picsum.photos/seed/${item.product.name}/100`} alt={item.product.name} className="c-img" />
                <div className="c-info">
                  <div className="c-title">{item.product.name}</div>
                  {item.variant ? <div className="c-variant">Variant: {item.variant.name}</div> : null}
                  <div className="c-price">{(item.price || 0).toLocaleString()} so'm</div>
                </div>
              </div>
              <div className="c-actions">
                <div className="qty-stepper" style={{width: 100, height: 36}}>
                  <button className="qty-btn" onClick={() => decrease(cartKey)}><Minus size={16}/></button>
                  <span className="qty-val" style={{fontSize: 14}}>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => increase(cartKey)}><Plus size={16}/></button>
                </div>
                <button className="icon-btn" onClick={() => remove(cartKey)} style={{color: '#9ca3af'}}><Trash2 size={20} /></button>
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

const CheckoutPage = ({ cart, setCart, storeInfo, customer }) => {
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [deliveryTime, setDeliveryTime] = useState('Tezkor');
  const [paymentType, setPaymentType] = useState('cash');
  const [address, setAddress] = useState({ house: "", apt: "", code: "", phone: "+998", lat: null, lon: null });
  const [cashbackBalance, setCashbackBalance] = useState(0);
  const [useCashback, setUseCashback] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  
  const location = useLocation();
  const comment = location.state?.comment || "";
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  useEffect(() => {
     if (tgUser?.id && storeInfo?.id) {
         fetch(`https://sbphcaletzugfqdvglmj.supabase.co/rest/v1/customers?user_id=eq.${tgUser.id}&store_id=eq.${storeInfo.id}`, {
            headers: { "apikey": "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR", "Authorization": "Bearer sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR" }
         }).then(r=>r.json()).then(d => { if(d&&d.length>0) setCashbackBalance(parseFloat(d[0].balance)||0); });
     }
  }, [tgUser?.id, storeInfo?.id]);

  const cartItems = Object.values(cart);
  const itemsTotal = cartItems.reduce((sum, item) => sum + (item.quantity * (item.price || parseFloat(item.product.price))), 0);

  const applyPromo = async () => {
      if(!promoCode || !storeInfo?.id) return;
      try {
          const res = await fetch(`https://sbphcaletzugfqdvglmj.supabase.co/rest/v1/promo_codes?code=eq.${promoCode.toUpperCase()}&store_id=eq.${storeInfo.id}`, {
              headers: { "apikey": "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR", "Authorization": "Bearer sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR" }
          });
          const d = await res.json();
          if (d && d.length > 0) {
              const promo = d[0];
              setPromoDiscount(promo.is_percent ? (itemsTotal * promo.discount / 100) : promo.discount);
              setPromoApplied(true);
              showAlert("Promokod faollashdi!");
          } else {
              showAlert("Xato yoki muddati o'tgan promokod!");
              setPromoApplied(false);
              setPromoDiscount(0);
          }
      } catch(e) {}
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // km
      const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
      const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };
  
  let deliveryFee = 0;
  if (deliveryType === 'delivery') {
      if (storeInfo?.delivery_price && storeInfo?.lat && storeInfo?.lon && address.lat && address.lon) {
          const dist = getDistance(storeInfo.lat, storeInfo.lon, address.lat, address.lon);
          deliveryFee = Math.max(0, Math.round(dist * storeInfo.delivery_price));
      } else {
          deliveryFee = 5000; // default base delivery
      }
  }

  const vipDiscountPercent = customer ? (parseFloat(customer.total_spent || 0) >= 5000000 ? 5 : (parseFloat(customer.total_spent || 0) >= 1000000 ? 2 : 0)) : 0;
  const vipDiscountAmount = Math.round(itemsTotal * vipDiscountPercent / 100);

  let finalTotal = itemsTotal + deliveryFee - promoDiscount - vipDiscountAmount;
  let cashbackUsed = 0;
  if (useCashback && cashbackBalance > 0) {
      cashbackUsed = Math.min(cashbackBalance, finalTotal);
      finalTotal -= cashbackUsed;
  }
  finalTotal = Math.max(0, finalTotal);

  const checkout = () => {
    if (!window.Telegram?.WebApp) {
      showAlert("Faqat Telegram ichida buyurtma berish mumkin!");
      return;
    }
    window.Telegram.WebApp.sendData(JSON.stringify({
        action: 'checkout',
        items: cartItems.map(i => ({id: i.product.id, name: i.variant ? `${i.product.name} (${i.variant.name})` : i.product.name, price: i.price || i.product.price, quantity: i.quantity})),
        total: finalTotal,
        deliveryType: deliveryType,
        deliveryTime: deliveryTime,
        paymentType: paymentType,
        address: address,
        comment: comment,
        cashbackUsed,
        promoCode: promoApplied ? promoCode : null
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
            
            <div className="checkout-title" style={{marginTop: 16, fontSize: 13, color: 'var(--text-muted)'}}>Yetkazib berish vaqti</div>
            <select className="input-field" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}>
                <option value="Tezkor">Tezkor (Hozir)</option>
                <option value="1 soatdan keyin">1 soatdan keyin</option>
                <option value="2 soatdan keyin">2 soatdan keyin</option>
                <option value="Bugun kechqurun">Bugun kechqurun</option>
            </select>
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
          <button className={`seg-btn ${paymentType === 'card' ? 'active' : ''}`} onClick={() => setPaymentType('card')} style={{flex: '1 1 45%'}}>
            <CreditCard size={16} /> Karta orqali
          </button>
        </div>
        
        {paymentType === 'card' && storeInfo?.card_number && (
            <div style={{marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#334155', border: '1px solid #e2e8f0'}}>
                Iltimos, ushbu kartaga to'lovni amalga oshiring:<br/>
                <strong style={{fontSize: 16, display: 'block', marginTop: 4}}>{storeInfo.card_number}</strong>
            </div>
        )}

        <div className="checkout-title" style={{marginTop: 16}}>Promokod</div>
        <div style={{display: 'flex', gap: 8}}>
            <input className="input-field" placeholder="Kodni yozing" value={promoCode} onChange={e=>setPromoCode(e.target.value)} disabled={promoApplied} style={{marginBottom: 0, flex: 1}}/>
            <button className="btn-primary" onClick={applyPromo} disabled={promoApplied} style={{width: 'auto', padding: '0 16px', borderRadius: 12}}>{promoApplied ? 'Faol' : "Qo'llash"}</button>
        </div>

        {cashbackBalance > 0 && (
            <div style={{marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(13, 148, 114, 0.05)', borderRadius: 12, border: '1px solid rgba(13, 148, 114, 0.2)'}}>
                <div>
                    <div style={{fontWeight: 600, color: 'var(--primary)', fontSize: 14}}>Keshbek mavjud 🎁</div>
                    <div style={{fontSize: 12, color: '#64748b'}}>Balans: {cashbackBalance.toLocaleString()} so'm</div>
                </div>
                <input type="checkbox" checked={useCashback} onChange={e => setUseCashback(e.target.checked)} style={{width: 20, height: 20, accentColor: 'var(--primary)'}} />
            </div>
        )}
        
        <div style={{marginTop: 16}}>
          <div className="summary-row">
            <span style={{display: 'flex', alignItems: 'center', gap: 8}}><FileText size={16} color="var(--text-muted)"/> Mahsulotlar:</span>
            <span>{itemsTotal.toLocaleString()} so'm</span>
          </div>
          <div className="summary-row">
            <span style={{display: 'flex', alignItems: 'center', gap: 8}}><Truck size={16} color="var(--text-muted)"/> Xizmat:</span>
            <span>{deliveryFee.toLocaleString()} so'm</span>
          </div>
          {promoApplied && (
              <div className="summary-row" style={{color: '#0ea5e9'}}>
                <span>Chegirma:</span>
                <span>-{promoDiscount.toLocaleString()} so'm</span>
              </div>
          )}
          {vipDiscountAmount > 0 && (
              <div className="summary-row" style={{color: '#eab308'}}>
                <span>VIP Status ({vipDiscountPercent}%):</span>
                <span>-{vipDiscountAmount.toLocaleString()} so'm</span>
              </div>
          )}
          {useCashback && cashbackUsed > 0 && (
              <div className="summary-row" style={{color: 'var(--primary)'}}>
                <span>Keshbekdan:</span>
                <span>-{cashbackUsed.toLocaleString()} so'm</span>
              </div>
          )}
          <div className="summary-total">
            <span>Jami:</span>
            <span style={{color: 'var(--primary)'}}>{finalTotal.toLocaleString()} so'm</span>
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

const ProfileOrdersPage = ({ storeInfo }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  useEffect(() => {
    if (tgUser?.id && storeInfo?.id) {
       fetch(`https://sbphcaletzugfqdvglmj.supabase.co/rest/v1/orders?user_id=eq.${tgUser.id}&store_id=eq.${storeInfo.id}&order=date.desc`, {
           headers: { "apikey": "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR", "Authorization": "Bearer sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR" }
       }).then(r=>r.json()).then(d => { setOrders(d || []); setLoading(false); }).catch(() => setLoading(false));
    } else {
       setLoading(false);
    }
  }, [tgUser?.id, storeInfo?.id]);

  if (loading) return <div className="content" style={{padding: 32, textAlign: 'center', color: '#64748b'}}>Yuklanmoqda...</div>;

  return (
    <div className="content" style={{paddingTop: 8, paddingBottom: 100}}>
      {orders.length === 0 ? (
        <div className="empty">
          <Package size={64} className="empty-icon" />
          <div className="empty-title">Buyurtmalar yo'q</div>
          <div className="empty-sub">Hali hech narsa xarid qilmadingiz</div>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px'}}>
           {orders.map(o => (
               <div key={o.order_id} style={{background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                       <span style={{fontWeight: 700, fontSize: 16}}>#{o.order_id}</span>
                       <span style={{color: '#94a3b8', fontSize: 12}}>{new Date(o.date).toLocaleString('uz-UZ')}</span>
                   </div>
                   
                   <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                       <div style={{flex: 1, height: 6, background: o.status === 'Bekor qilingan' ? '#fee2e2' : 'var(--primary)', borderRadius: 3}}></div>
                       <div style={{flex: 1, height: 6, background: o.status === 'Yetkazilmoqda' || o.status === 'Bajarildi' ? 'var(--primary)' : '#e2e8f0', borderRadius: 3, margin: '0 4px'}}></div>
                       <div style={{flex: 1, height: 6, background: o.status === 'Bajarildi' ? 'var(--primary)' : '#e2e8f0', borderRadius: 3}}></div>
                   </div>
                   <div style={{textAlign: 'center', fontSize: 13, fontWeight: 600, color: o.status === 'Bekor qilingan' ? '#ef4444' : 'var(--primary)', marginBottom: 12}}>Holati: {o.status}</div>

                   <div style={{marginBottom: 12, fontSize: 13, color: '#475569', background: '#f8fafc', padding: 12, borderRadius: 12}}>
                     {o.items?.map((i, idx) => (
                         <div key={idx} style={{marginBottom: 4}}>• {i.name} <b style={{color:'#000'}}>x{i.quantity}</b></div>
                     ))}
                   </div>
                   <div style={{fontWeight: 700, color: 'var(--primary)', fontSize: 16, textAlign: 'right'}}>{(o.total || 0).toLocaleString()} so'm</div>
               </div>
           ))}
        </div>
      )}
    </div>
  );
};

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

const ProfilePage = ({ lang, setLang, t, storeInfo, customer }) => {
  const navigate = useNavigate();
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const storeId = storeInfo?.id;
  const totalSpent = parseFloat(customer?.total_spent || 0);
  let vipLevel = 'Bronza', vipDiscount = 0, vipColor = '#cd7f32';
  if (totalSpent >= 5000000) { vipLevel = 'Oltin'; vipDiscount = 5; vipColor = '#eab308'; }
  else if (totalSpent >= 1000000) { vipLevel = 'Kumush'; vipDiscount = 2; vipColor = '#94a3b8'; }

  const handleSpin = async () => {
      try {
          const res = await fetch('https://webapp-kohl-kappa.vercel.app/api/spin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ store_id: storeId, user_id: tgUser?.id, reward_amount: 5000 })
          });
          const data = await res.json();
          if (res.ok && data.ok) {
              showAlert(`Tabriklaymiz! Siz 5000 so'm keshbek yutib oldingiz! Yangi balansingiz: ${data.new_balance} so'm`);
          } else {
              showAlert(data.error || "Siz bugun o'ynagansiz! Ertaga keling.");
          }
      } catch(e) {
          showAlert("Xatolik yuz berdi");
      }
  };
  
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
      
      <div style={{margin: '16px 16px', background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'}}>
         <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
            <Share2 size={20} color="var(--primary)" />
            <span style={{fontWeight: 700, fontSize: 15}}>Referal tizimi (Bonuslar)</span>
         </div>
         <p style={{fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.4}}>Do'stlaringizni taklif qiling va ularning har bir xarididan <b style={{color: 'var(--primary)'}}>3% keshbek</b> oling!</p>
         <div style={{background: '#f1f5f9', padding: '10px 12px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <span style={{fontSize: 13, fontWeight: 600, color: '#334155'}}>{tgUser?.id ? `...bot?start=ref_${tgUser.id}` : "Noma'lum"}</span>
             <button style={{background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 13}} onClick={() => {
                 if(tgUser?.id) navigator.clipboard.writeText(`ref_${tgUser.id}`);
                 showAlert("Nusxa olindi!");
             }}>Nusxa olish</button>
         </div>
      </div>
      
      {/* VIP Status */}
      <div style={{margin: '16px 16px 0', background: `linear-gradient(135deg, ${vipColor}aa, ${vipColor})`, borderRadius: 16, padding: 16, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden'}}>
         <div style={{fontWeight: 800, fontSize: 20, marginBottom: 4}}>{vipLevel} Status</div>
         <div style={{fontSize: 14, opacity: 0.9}}>Sizning doimiy chegirmangiz: {vipDiscount}%</div>
         <div style={{marginTop: 12, fontSize: 12, opacity: 0.8}}>Umumiy xaridlar: {totalSpent.toLocaleString()} so'm</div>
         <div style={{position: 'absolute', right: -20, top: -20, opacity: 0.2}}><ShoppingCart size={100} /></div>
      </div>
      
      {/* Wheel of Fortune Button */}
      <div style={{margin: '16px 16px', background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
         <div>
            <div style={{fontWeight: 700, fontSize: 15, marginBottom: 4}}>🎡 Omad G'ildiragi</div>
            <div style={{fontSize: 12, color: '#64748b'}}>Har kuni bepul aylantiring</div>
         </div>
         <button onClick={handleSpin} style={{background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 12, fontWeight: 700}}>Aylantirish</button>
      </div>

      <div style={{padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#000'}}>{t('lang', lang)}</div>
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
  const [banners, setBanners] = useState([]);
  const [customer, setCustomer] = useState(null);
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
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(p => {
            let parsedName = p.name;
            try {
              const j = JSON.parse(p.name);
              parsedName = j[lang] || j.uz || p.name;
            } catch(e) {}
            return { ...p, originalName: p.name, name: parsedName };
          });
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      })
      .catch(err => { console.error("Error fetching products:", err); setProducts([]); });

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
           if (store.theme_color) document.documentElement.style.setProperty('--primary', store.theme_color);
        }
      });

      // Fetch banners
      fetch(`${SUPABASE_URL}/rest/v1/banners?store_id=eq.${storeId}&select=*`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      })
      .then(res => res.json())
      .then(data => setBanners(Array.isArray(data) ? data : []));

      // Fetch customer
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser?.id) {
          fetch(`${SUPABASE_URL}/rest/v1/customers?store_id=eq.${storeId}&user_id=eq.${tgUser.id}`, {
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
          })
          .then(res => res.json())
          .then(data => {
             if (data && data.length > 0) setCustomer(data[0]);
          });
      }
    }
  }, [storeId, lang]);

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
        <Route path="/" element={<HomePage products={products} banners={banners} favs={favs} toggleFav={toggleFav} onSelectProduct={setSelectedProduct} />} />
        <Route path="/menu" element={<MenuPage products={products} favs={favs} toggleFav={toggleFav} onSelectProduct={setSelectedProduct} />} />
        <Route path="/favorites" element={<FavoritesPage products={products} favs={favs} toggleFav={toggleFav} onSelectProduct={setSelectedProduct} />} />
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
        <Route path="/checkout" element={<CheckoutPage cart={cart} setCart={setCart} storeInfo={storeInfo} customer={customer} />} />
        <Route path="/profile" element={<ProfilePage lang={lang} setLang={setLang} t={t} storeInfo={storeInfo} customer={customer} />} />
        <Route path="/profile/info" element={<ProfileInfoPage />} />
        <Route path="/profile/orders" element={<ProfileOrdersPage storeInfo={storeInfo} />} />
        <Route path="/profile/support" element={<ProfileSupportPage />} />
      </Routes>

      <ProductModal product={selectedProduct} allProducts={products} onSelectProduct={setSelectedProduct} onClose={() => setSelectedProduct(null)} cart={cart} setCart={setCart} favs={favs} toggleFav={toggleFav} />
      
      {showBottomNav && <BottomNav cartCount={Object.values(cart).reduce((s, i) => s + i.quantity, 0)} favCount={favs.size} t={t} lang={lang} />}
    </div>
  )
}
