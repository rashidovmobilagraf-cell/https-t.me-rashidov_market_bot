"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem("pos_user");
    if (!user && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  if (!mounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Yuklanmoqda...</div>;

  const isFullScreenRoute = pathname === '/login' || pathname === '/self-checkout';

  if (isFullScreenRoute) {
    return <main className="flex-1 w-full min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex w-full min-h-full">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen bg-slate-50">
        {children}
      </main>
    </div>
  );
}
