import React, { useState } from 'react';
import { LogIn, ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react';
import { User, UserSession } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
  users: User[];
}

export default function Login({ onLogin, users }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [schoolName, setSchoolName] = useState(() => {
    return localStorage.getItem('colegio_reacao_school_name') || 'Colégio Reação';
  });

  const handleGuestLogin = () => {
    onLogin({
      email: 'convidado@sistema.com',
      name: 'Visitante (Convidado)',
      role: 'guest'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      onLogin({
        email: user.email,
        name: user.name,
        role: user.role
      });
    } else {
      setError('E-mail ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-48 h-48 mb-6">
            <img 
              src="https://i.imgur.com/4XiztTt.png" 
              alt="Logo" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-gray-500 text-sm">Sistema de Gestão de Mecanografia</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#18181b] rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f5c518] to-transparent opacity-50" />
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Bem-vindo</h2>
            <p className="text-gray-400 text-sm">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                <Mail size={14} />
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                <Lock size={14} />
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#f5c518] hover:bg-[#e2b516] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#f5c518]/10 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <LogIn size={18} />
              Entrar no Sistema
            </button>

            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={18} />
              Entrar como Convidado
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[11px] text-gray-600">
              © 2026 {schoolName} • Ambiente Seguro
            </p>
          </div>
        </div>
        
        <p className="mt-6 text-center text-[11px] text-gray-500 uppercase tracking-widest font-bold opacity-30">
          Super Admin Access Enabled
        </p>
      </div>
    </div>
  );
}
