'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, Wallet, FileText, Settings, Store } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Bosh sahifa', href: '/', icon: LayoutDashboard },
    { name: 'Kassa (POS)', href: '/pos', icon: ShoppingCart },
    { name: 'Savdolar Tarixi', href: '/sales', icon: FileText },
    { name: 'Tovarlar', href: '/products', icon: Package },
    { name: 'Buyurtmalar (Avto)', href: '/orders', icon: Package },
    { name: 'Mijozlar (CRM)', href: '/customers', icon: Users },
    { name: 'Nasiya Daftar', href: '/nasiya', icon: Users },
    { name: 'Kirim-Chiqim', href: '/transactions', icon: Wallet },
    { name: 'Sozlamalar', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed">
      <div className="p-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Store size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] text-white tracking-tight leading-tight">RASHIDOV MARKET</span>
            <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase mt-0.5">No.1 POS System</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-center text-slate-500">
        v1.0.0
      </div>
    </div>
  );
}
