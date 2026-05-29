"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseInt(price),
          oldPrice: oldPrice ? parseInt(oldPrice) : null,
          stock: parseInt(stock),
          imageUrl: ""
        })
      });
      setIsModalOpen(false);
      setName(""); setPrice(""); setOldPrice(""); setStock("");
      fetchProducts();
    } catch (error) {
      alert("Xatolik");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" /> Yangi qo'shish
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nomi</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Narx</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Soni (Ombor)</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Harakatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Mahsulotlar topilmadi.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{p.price.toLocaleString()} s.</span>
                    {p.oldPrice && <span className="text-xs text-gray-400 line-through ml-2">{p.oldPrice.toLocaleString()}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {p.stock} ta
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Edit className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Yangi mahsulot qo'shish</h2>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Snickers..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yangi narx (so'm)</label>
                  <input required value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="9600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eski narx (ixtiyoriy)</label>
                  <input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="12000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ombordagi soni</label>
                <input required value={stock} onChange={(e) => setStock(e.target.value)} type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="100" />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Bekor qilish</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
