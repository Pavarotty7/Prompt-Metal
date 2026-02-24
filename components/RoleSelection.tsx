
import React, { useMemo, useState } from 'react';
import { ShieldCheck, Mail, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, getAllowedEmails, isEmailAllowed, isFirebaseAuthConfigured } from '../services/firebase';

interface RoleSelectionProps {
  onSelect: (role: UserRole, stayLoggedIn: boolean, userId: string) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const firebaseReady = useMemo(() => isFirebaseAuthConfigured(), []);
  const allowedEmails = useMemo(() => getAllowedEmails(), []);

  const roleForEmail = (_value: string): UserRole => 'admin';

  const applyPersistence = async () => {
    if (!auth) return;
    await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);
  };

  const handleAuthSuccess = (userEmail: string) => {
    const normalizedEmail = userEmail.trim().toLowerCase();
    const role = roleForEmail(normalizedEmail);
    onSelect(role, stayLoggedIn, normalizedEmail);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firebaseReady || !auth) {
      setErrorMessage('Autenticação em preparação. Configure as variáveis VITE_FIREBASE_* no .env e reinicie a aplicação.');
      return;
    }

    try {
      setIsLoading(true);
      await applyPersistence();

      const normalizedEmail = email.trim().toLowerCase();
      if (!isEmailAllowed(normalizedEmail)) {
        setErrorMessage(`Acesso permitido apenas para: ${allowedEmails.join(', ')}`);
        return;
      }

      const credential = isRegisterMode
        ? await createUserWithEmailAndPassword(auth, normalizedEmail, password)
        : await signInWithEmailAndPassword(auth, normalizedEmail, password);

      const userEmail = credential.user.email || normalizedEmail;
      handleAuthSuccess(userEmail);
    } catch (error: any) {
      const errorCode = String(error?.code || '');
      if (errorCode.includes('auth/invalid-credential')) {
        setErrorMessage('Credenciais inválidas. Verifique e-mail e senha.');
      } else if (errorCode.includes('auth/email-already-in-use')) {
        setErrorMessage('Este e-mail já está em uso. Faça login em vez de criar conta.');
      } else if (errorCode.includes('auth/weak-password')) {
        setErrorMessage('Senha fraca. Use pelo menos 6 caracteres.');
      } else if (errorCode.includes('auth/popup-closed-by-user')) {
        setErrorMessage('Login cancelado. Tente novamente.');
      } else {
        setErrorMessage('Erro ao autenticar. Verifique configuração do Firebase Auth.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');

    try {
      setIsLoading(true);

      const urlResponse = await fetch('/api/auth/google/url', { credentials: 'include' });
      if (!urlResponse.ok) {
        setErrorMessage('Não foi possível iniciar autenticação Google.');
        return;
      }

      const { url } = await urlResponse.json();
      if (!url) {
        setErrorMessage('URL de autenticação Google inválida.');
        return;
      }

      const popup = window.open(url, 'promptmetal-google-auth', 'width=520,height=700');
      if (!popup) {
        setErrorMessage('O navegador bloqueou o popup. Permita popups e tente novamente.');
        return;
      }

      const authResult = await new Promise<'success' | 'error'>((resolve) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          resolve('error');
        }, 120000);

        const interval = window.setInterval(() => {
          if (popup.closed) {
            cleanup();
            resolve('error');
          }
        }, 500);

        const onMessage = (event: MessageEvent) => {
          if (event.source !== popup) return;

          const data = event.data || {};
          if (data?.type === 'OAUTH_AUTH_SUCCESS') {
            cleanup();
            resolve('success');
          } else if (data?.type === 'OAUTH_AUTH_ERROR') {
            cleanup();
            resolve('error');
          }
        };

        const cleanup = () => {
          window.clearTimeout(timeout);
          window.clearInterval(interval);
          window.removeEventListener('message', onMessage);
          if (!popup.closed) popup.close();
        };

        window.addEventListener('message', onMessage);
      });

      if (authResult !== 'success') {
        setErrorMessage('Falha no login com Google. Tente novamente.');
        return;
      }

      const userResponse = await fetch('/api/auth/google/user', { credentials: 'include' });
      if (!userResponse.ok) {
        let backendError = '';
        try {
          const payload = await userResponse.json();
          backendError = String(payload?.error || '').trim();
        } catch {
          backendError = '';
        }

        setErrorMessage(backendError || 'Não foi possível obter o e-mail da conta Google autenticada.');
        return;
      }

      const userPayload = await userResponse.json();
      const userEmail = String(userPayload?.email || '').trim().toLowerCase();
      if (!userEmail) {
        setErrorMessage('Não foi possível identificar o e-mail da conta Google.');
        return;
      }

      if (!isEmailAllowed(userEmail)) {
        await fetch('/api/auth/google/logout', { method: 'POST', credentials: 'include' });
        setErrorMessage(`Acesso permitido apenas para: ${allowedEmails.join(', ')}`);
        return;
      }

      if (firebaseReady && auth) {
        await applyPersistence();
        await signOut(auth).catch(() => undefined);
      }

      handleAuthSuccess(userEmail);
    } catch (error: any) {
      const fallback = 'Falha no login com Google. Verifique a configuração OAuth e tente novamente.';
      const message = String(error?.message || '').trim();
      setErrorMessage(message || fallback);
    } finally {
      setIsLoading(false);
    }
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
            {isRegisterMode ? 'Criar Conta' : 'Acesso ao Sistema'}
          </h2>

          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest pl-1">E-mail</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className={`w-full bg-slate-900/50 border ${errorMessage ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 focus:border-blue-500'} rounded-2xl py-4 pl-12 pr-4 text-white outline-none transition-all font-black tracking-widest`}
                    required
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
                    placeholder="Sua senha"
                    className={`w-full bg-slate-900/50 border ${errorMessage ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 focus:border-blue-500'} rounded-2xl py-4 pl-12 pr-12 text-white outline-none transition-all font-black tracking-widest`}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errorMessage && <p className="text-[10px] text-red-500 font-black uppercase mt-2 pl-1 animate-pulse text-center">{errorMessage}</p>}
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
              disabled={isLoading}
              className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20 active:scale-95"
            >
              {isLoading ? 'Autenticando...' : isRegisterMode ? 'Criar conta com e-mail' : 'Entrar com e-mail'}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 disabled:opacity-60"
            >
              Entrar com Google
            </button>

            <button
              type="button"
              onClick={() => setIsRegisterMode(prev => !prev)}
              className="w-full text-[10px] text-slate-400 hover:text-slate-300 font-black uppercase tracking-widest"
            >
              {isRegisterMode ? 'Já tem conta? Entrar' : 'Não tem conta? Criar com e-mail'}
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
