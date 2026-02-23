
import React, { useState } from 'react';
import { ShieldCheck, User, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSelectionProps {
  onSelect: (role: UserRole, stayLoggedIn: boolean, userId: string) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [error, setError] = useState(false);

  const ADMIN_USERS = {
    'Fabio': 'fb123',
    'Rodrigo': 'admin',
    'Diego': 'joao1234'
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check Admin users
    const adminPassword = ADMIN_USERS[username as keyof typeof ADMIN_USERS];
    if (adminPassword && adminPassword === password) {
      onSelect('admin', stayLoggedIn, username.trim().toLowerCase());
      return;
    }

    // Check Guest
    if (username.toLowerCase() === 'convidado' && password === '1234') {
      onSelect('guest', stayLoggedIn, username.trim().toLowerCase());
      return;
    }

    // If none match
    setError(true);
    setTimeout(() => setError(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a101f] flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mb-8 flex justify-center items-center gap-3">
            <span className="text-5xl font-black tracking-tighter text-white uppercase drop-shadow-md">Prompt</span>
            <span className="text-5xl font-black tracking-tighter text-amber-500 uppercase drop-shadow-md">Metal</span>
          </div>
          <p className="text-slate-400 text-sm font-black tracking-[0.3em] uppercase">
            Enterprise Solutions
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl space-y-6">
          <h2 className="text-white text-xl font-black text-center mb-2 uppercase tracking-tight">
            Acesso ao Sistema
          </h2>

          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest pl-1">Usuário / Login</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu nome de usuário"
                    className={`w-full bg-slate-900/50 border ${error ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 focus:border-blue-500'} rounded-2xl py-4 pl-12 pr-4 text-white outline-none transition-all font-black tracking-widest`}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest pl-1">Senha de Acesso</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    className={`w-full bg-slate-900/50 border ${error ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 focus:border-blue-500'} rounded-2xl py-4 pl-12 pr-12 text-white outline-none transition-all font-black tracking-widest`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <p className="text-[10px] text-red-500 font-black uppercase mt-2 pl-1 animate-pulse text-center">Credenciais inválidas. Verifique usuário e senha.</p>}
              </div>

              <label className="flex items-center gap-3 cursor-pointer group py-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={stayLoggedIn}
                    onChange={(e) => setStayLoggedIn(e.target.checked)}
                  />
                  <div className="w-5 h-5 border-2 border-white/20 rounded-md bg-transparent peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Manter logado neste dispositivo</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20 active:scale-95"
            >
              Entrar no Sistema
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; 2024 Prompt Metal Enterprise. Lisboa, Portugal.
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
