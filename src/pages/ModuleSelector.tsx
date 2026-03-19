import { useState } from "react";
import { Wallet, Bike } from "lucide-react";
import motoImage from "@/assets/moto.jpeg";

interface ModuleSelectorProps {
  onSelect: (module: "wallet" | "moto") => void;
  onSignOut: () => void;
  userEmail: string;
}

export default function ModuleSelector({ onSelect, onSignOut, userEmail }: ModuleSelectorProps) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useState(() => {
    setTimeout(() => setMounted(true), 50);
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(140deg, hsl(230 40% 12%) 0%, hsl(250 50% 18%) 30%, hsl(220 60% 14%) 60%, hsl(200 50% 10%) 100%)",
      }} />

      {/* Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[300px] h-[300px] rounded-full opacity-30 blur-[100px]"
          style={{ background: "hsl(220 70% 50%)", animation: "orb1 18s ease-in-out infinite" }} />
        <div className="absolute bottom-[10%] right-[15%] w-[250px] h-[250px] rounded-full opacity-25 blur-[90px]"
          style={{ background: "hsl(270 60% 55%)", animation: "orb2 22s ease-in-out infinite" }} />
      </div>

      <div className={`relative z-10 w-full max-w-2xl transition-all duration-700 ease-out ${mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"}`}>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">¿A dónde vamos?</h1>
          <p className="mt-2 text-sm text-white/40">{userEmail}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Wallet Module */}
          <button
            onClick={() => onSelect("wallet")}
            onMouseEnter={() => setHovered("wallet")}
            onMouseLeave={() => setHovered(null)}
            className={`group relative flex flex-col items-center gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-xl shadow-[0_8px_60px_rgba(0,0,0,0.4)] transition-all duration-500 hover:border-blue-500/30 hover:bg-white/[0.08] hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] ${hovered === "wallet" ? "shadow-2xl" : ""}`}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl">
                <Wallet className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Mis Finanzas</h2>
              <p className="mt-1.5 text-sm text-white/40">Billetera, gastos y presupuesto mensual</p>
            </div>
          </button>

          {/* Moto Module */}
          <button
            onClick={() => onSelect("moto")}
            onMouseEnter={() => setHovered("moto")}
            onMouseLeave={() => setHovered(null)}
            className={`group relative flex flex-col items-center gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-xl shadow-[0_8px_60px_rgba(0,0,0,0.4)] transition-all duration-500 hover:border-emerald-500/30 hover:bg-white/[0.08] hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] ${hovered === "moto" ? "shadow-2xl" : ""}`}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60" />
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-xl ring-2 ring-white/10">
                <img src={motoImage} alt="Mi moto" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Mi Moto</h2>
              <p className="mt-1.5 text-sm text-white/40">SOAT, tecnomecánica, mantenimientos y gasolina</p>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button onClick={onSignOut} className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>

      <style>{`
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(60px, -40px); }
          66% { transform: translate(-30px, 50px); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-50px, 30px); }
          66% { transform: translate(40px, -60px); }
        }
      `}</style>
    </div>
  );
}
