const fs = require('fs');

const path = 'C:/Users/Profit/.gemini/antigravity/scratch/webapp/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const adminComponent = `
const AdminPanelPage = ({ products }) => {
  const [items, setItems] = useState(products);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image: '' });
  
  useEffect(() => {
    setItems(products);
  }, [products]);

  const handleDelete = async (id) => {
    if(window.confirm("O'chirasizmi?")) {
      try {
        await fetch(\`/api/products/\${id}\`, { method: 'DELETE' });
        setItems(items.filter(p => p.id !== id));
      } catch (e) {
        alert("Xatolik yuz berdi");
      }
    }
  };

  const handleAdd = async () => {
    if(!newProduct.name || !newProduct.price) return alert("To'ldiring!");
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if(data.success) {
        setItems([...items, data.product]);
        setShowAdd(false);
        setNewProduct({ name: '', price: '', category: '', image: '' });
      } else {
        alert("Xatolik!");
      }
    } catch (e) {
      alert("Xatolik yuz berdi");
    }
  };

  return (
    <div className="content" style={{padding: 16, background: '#f5f5f5', minHeight: '100vh'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
        <h2 style={{margin: 0}}>Boshqaruv Paneli</h2>
        <button className="btn-primary" style={{padding: '8px 16px', width: 'auto'}} onClick={() => setShowAdd(true)}>
          <Plus size={16} style={{marginRight: 4}} /> Qo'shish
        </button>
      </div>

      {showAdd && (
        <div style={{background: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
          <h3 style={{marginTop: 0, marginBottom: 16}}>Yangi mahsulot</h3>
          <input className="input-field" placeholder="Nomi (masalan: Cola 1L)" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{marginBottom: 12}} />
          <input className="input-field" type="number" placeholder="Narxi (masalan: 12000)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={{marginBottom: 12}} />
          <input className="input-field" placeholder="Kategoriya (masalan: Ichimliklar)" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{marginBottom: 12}} />
          <input className="input-field" placeholder="Rasm havolasi (URL yoki bo'sh joy qoldiring)" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} style={{marginBottom: 12}} />
          <div style={{display: 'flex', gap: 8}}>
            <button className="btn-primary" onClick={handleAdd} style={{flex: 1}}>Saqlash</button>
            <button className="btn-secondary" onClick={() => setShowAdd(false)} style={{flex: 1, background: '#e2e8f0', color: '#333'}}>Bekor qilish</button>
          </div>
        </div>
      )}

      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {items.map(p => (
          <div key={p.id} style={{background: '#fff', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)'}}>
            <img src={p.image || "https://picsum.photos/300"} alt={p.name} style={{width: 60, height: 60, objectFit: 'cover', borderRadius: 8}} />
            <div style={{flex: 1}}>
              <div style={{fontWeight: 600}}>{p.name}</div>
              <div style={{color: 'var(--primary)', fontWeight: 500}}>{p.price} so'm</div>
              <div style={{color: '#888', fontSize: 12}}>{p.category}</div>
            </div>
            <button className="icon-btn" style={{color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: 8, height: 'auto', width: 'auto', borderRadius: 8}} onClick={() => handleDelete(p.id)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {items.length === 0 && <div style={{textAlign: 'center', color: '#888', marginTop: 32}}>Mahsulotlar yo'q</div>}
      </div>
    </div>
  );
};

export default function App() {
`;

content = content.replace('export default function App() {', adminComponent);

const routeToAdd = '<Route path="/admin-panel" element={<AdminPanelPage products={products} />} />';
content = content.replace('<Routes>', '<Routes>\n        ' + routeToAdd);

const navLogic = `
  const getTitle = () => {
    if (location.pathname === '/admin-panel') return null;
`;
content = content.replace('const getTitle = () => {', navLogic);

const headerLogic = `
      {location.pathname !== '/checkout' && location.pathname !== '/cart' && location.pathname !== '/admin-panel' && (
`;
content = content.replace("{location.pathname !== '/checkout' && location.pathname !== '/cart' && (", headerLogic);

fs.writeFileSync(path, content);
