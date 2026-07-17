/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Shield, School, User, Lock, Save, Sparkles, Key } from 'lucide-react';
import { UserSession } from '../types';

interface OSConfiguracoesProps {
  user: UserSession;
  onUpdateUser: (updated: UserSession) => void;
  onSaveLogsClear?: () => void;
}

export default function OSConfiguracoes({
  user,
  onUpdateUser,
  onSaveLogsClear
}: OSConfiguracoesProps) {
  
  // School states
  const [schoolName, setSchoolName] = useState(() => {
    return localStorage.getItem('colegio_reacao_school_name') || 'Colégio Reação';
  });
  const [address, setAddress] = useState(() => {
    return localStorage.getItem('colegio_reacao_school_address') || 'QNJ, Taguatinga - DF';
  });
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem('colegio_reacao_school_phone') || '(61) 90000-0000';
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('colegio_reacao_school_email') || 'mecanografia@colegioreacaodf.com';
  });
  const [version, setVersion] = useState('1.5.0');

  // User states
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('colegio_reacao_school_name', schoolName);
    localStorage.setItem('colegio_reacao_school_email', email);
    localStorage.setItem('colegio_reacao_school_address', address);
    localStorage.setItem('colegio_reacao_school_phone', phone);
    
    // Trigger storage event so other components (e.g. headers or sidebar if needed) can update if they listen to it
    window.dispatchEvent(new Event('storage'));
    
    alert('Configurações da instituição salvas com sucesso!');
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    onUpdateUser({
      ...user,
      name: userName,
      email: userEmail,
      password: password || undefined
    });
    
    setPassword('');
    setConfirmPassword('');
    alert('Perfil do usuário atualizado!');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-3 text-white">
            <Settings size={24} className="text-[#f5c518]" />
            Configurações do Sistema
          </h2>
          <p className="text-sm text-[#a1a1aa] mt-1">Gerencie os dados da instituição e suas preferências de perfil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-left">
        {/* Left: Institution Settings */}
        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <School size={20} className="text-[#f5c518]" />
            <h2 className="font-bold text-white">Dados da Instituição</h2>
          </div>

          <form onSubmit={handleSchoolSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Nome da Escola</label>
              <input
                type="text"
                placeholder="Ex: Colégio Reação"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5c518]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">E-mail de Contato</label>
              <input
                type="email"
                placeholder="email@escola.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5c518]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Sistema</label>
                <div className="w-full bg-[#0a0a0c]/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed italic">
                  OS & Mecanografia
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Versão</label>
                <div className="w-full bg-[#0a0a0c]/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed italic">
                  1.5.0
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#f5c518] hover:bg-amber-400 text-black font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 ml-auto"
            >
              <Save size={18} />
              Atualizar Dados
            </button>
          </form>
        </div>

        {/* Right: User Profile */}
        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <User size={20} className="text-[#f5c518]" />
            <h2 className="font-bold text-white">Meu Perfil</h2>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-[#f5c518] flex items-center justify-center text-black text-2xl font-black">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-white">{user.name}</div>
              <div className="text-xs text-gray-400">{user.email}</div>
              <div className="mt-2">
                {user.role === 'super_admin' ? (
                  <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20">SUPER ADMIN</span>
                ) : user.role === 'admin' ? (
                  <span className="bg-[#f5c518]/10 text-[#f5c518] text-[10px] font-bold px-2 py-0.5 rounded border border-[#f5c518]/20">ADMINISTRADOR</span>
                ) : (
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">OPERADOR</span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Nome de Exibição</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5c518]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">E-mail de Acesso</label>
              <input
                type="email"
                disabled
                value={userEmail}
                className="w-full bg-[#0a0a0c]/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Nova Senha (opcional)</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Confirmar Senha</label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-white/5 hover:bg-white/10 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-white/10 ml-auto"
              >
                <Save size={18} />
                Salvar Perfil
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
