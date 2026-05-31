"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error("PIN 4 xonali bo'lishi kerak");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Xatolik yuz berdi");
      }
      
      localStorage.setItem("pos_user", JSON.stringify(data));
      toast.success("Xush kelibsiz, " + data.name);
      router.push("/pos");
    } catch (err: any) {
      toast.error(err.message);
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const addNumber = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };
  
  const removeNumber = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Tizimga kirish</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">4 xonali PIN kodni kiriting (Standart: 1234)</p>
        
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? 'bg-blue-600' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['1','2','3','4','5','6','7','8','9','C','0','OK'].map(key => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === 'C') removeNumber();
                  else if (key === 'OK') handleLogin({ preventDefault: () => {} } as any);
                  else addNumber(key);
                }}
                className={`p-4 rounded-xl text-xl font-bold transition-colors ${
                  key === 'OK' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                  key === 'C' ? 'bg-red-100 text-red-600 hover:bg-red-200' :
                  'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
