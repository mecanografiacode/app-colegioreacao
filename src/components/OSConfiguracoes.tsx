/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Shield, School, User, Lock, Save, Sparkles, Key, Database, Download, Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';
import FirebaseService from '../services/FirebaseService';

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

  // Backup States
  const [isImporting, setIsImporting] = useState(false);

  const handleExportData = () => {
    try {
      const backupData = {
        users: JSON.parse(localStorage.getItem('colegio_reacao_users') || '[]'),
        ordens: JSON.parse(localStorage.getItem('colegio_reacao_ordens') || '[]'),
        equipamentos: JSON.parse(localStorage.getItem('colegio_reacao_equipamentos') || '[]'),
        suporte: JSON.parse(localStorage.getItem('colegio_reacao_suporte') || '[]'),
        funcionarios: JSON.parse(localStorage.getItem('colegio_reacao_funcionarios') || '[]'),
        auditoria: JSON.parse(localStorage.getItem('colegio_reacao_auditoria') || '[]'),
        auditoria_funcionarios: JSON.parse(localStorage.getItem('colegio_reacao_auditoria_funcionarios') || '[]'),
        emprestimos: JSON.parse(localStorage.getItem('colegio_reacao_emprestimos') || '[]'),
        schoolName: localStorage.getItem('colegio_reacao_school_name') || 'Colégio Reação',
        schoolEmail: localStorage.getItem('colegio_reacao_school_email') || 'mecanografia@colegioreacaodf.com',
        schoolAddress: localStorage.getItem('colegio_reacao_school_address') || 'QNJ, Taguatinga - DF',
        schoolPhone: localStorage.getItem('colegio_reacao_school_phone') || '(61) 90000-0000',
        timestamp: new Date().toISOString()
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `colegio_reacao_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Erro ao exportar dados: ' + (err as Error).message);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    fileReader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') throw new Error('Formato de arquivo inválido.');

        const data = JSON.parse(result);

        // Basic validation
        if (!data || typeof data !== 'object') throw new Error('JSON inválido ou corrompido.');

        const dbPrefix = 'colegio_reacao_';

        // Set locally
        if (Array.isArray(data.users)) localStorage.setItem(dbPrefix + 'users', JSON.stringify(data.users));
        if (Array.isArray(data.ordens)) localStorage.setItem(dbPrefix + 'ordens', JSON.stringify(data.ordens));
        if (Array.isArray(data.equipamentos)) localStorage.setItem(dbPrefix + 'equipamentos', JSON.stringify(data.equipamentos));
        if (Array.isArray(data.suporte)) localStorage.setItem(dbPrefix + 'suporte', JSON.stringify(data.suporte));
        if (Array.isArray(data.funcionarios)) localStorage.setItem(dbPrefix + 'funcionarios', JSON.stringify(data.funcionarios));
        if (Array.isArray(data.auditoria)) localStorage.setItem(dbPrefix + 'auditoria', JSON.stringify(data.auditoria));
        if (Array.isArray(data.auditoria_funcionarios)) localStorage.setItem(dbPrefix + 'auditoria_funcionarios', JSON.stringify(data.auditoria_funcionarios));
        if (Array.isArray(data.emprestimos)) localStorage.setItem(dbPrefix + 'emprestimos', JSON.stringify(data.emprestimos));

        if (data.schoolName) localStorage.setItem(dbPrefix + 'school_name', data.schoolName);
        if (data.schoolEmail) localStorage.setItem(dbPrefix + 'school_email', data.schoolEmail);
        if (data.schoolAddress) localStorage.setItem(dbPrefix + 'school_address', data.schoolAddress);
        if (data.schoolPhone) localStorage.setItem(dbPrefix + 'school_phone', data.schoolPhone);

        // Upload to Firebase if configured
        const isFirebaseActive = FirebaseService.isConfigured();
        if (isFirebaseActive) {
          console.log('[Import] Firebase is active. Pushing imported data to Firestore...');
          
          const uploadToFirestore = async (key: string, items: any[]) => {
            for (const item of items) {
              await (FirebaseService as any)[key].create(item, item.id);
            }
          };

          if (Array.isArray(data.users)) await uploadToFirestore('users', data.users);
          if (Array.isArray(data.ordens)) await uploadToFirestore('ordens', data.ordens);
          if (Array.isArray(data.equipamentos)) await uploadToFirestore('equipamentos', data.equipamentos);
          if (Array.isArray(data.suporte)) await uploadToFirestore('suporte', data.suporte);
          if (Array.isArray(data.funcionarios)) await uploadToFirestore('funcionarios', data.funcionarios);
          if (Array.isArray(data.auditoria)) await uploadToFirestore('auditoria', data.auditoria);
          if (Array.isArray(data.emprestimos)) await uploadToFirestore('emprestimos', data.emprestimos);

          if (data.schoolName) {
            await FirebaseService.settings.create({
              id: 'school_config',
              name: data.schoolName,
              email: data.schoolEmail || '',
              address: data.schoolAddress || '',
              phone: data.schoolPhone || ''
            }, 'school_config');
          }
        }

        // Notify storage change so App.tsx reloads state
        window.dispatchEvent(new Event('storage'));
        
        // Update states to show immediate update
        if (data.schoolName) setSchoolName(data.schoolName);
        if (data.schoolEmail) setEmail(data.schoolEmail);
        if (data.schoolAddress) setAddress(data.schoolAddress);
        if (data.schoolPhone) setPhone(data.schoolPhone);

        alert('Backup importado com sucesso! Seus dados foram salvos localmente' + (isFirebaseActive ? ' e sincronizados na nuvem Firestore.' : '.'));
        window.location.reload(); // Refresh to cleanly reload context
      } catch (err) {
        alert('Erro ao importar backup: ' + (err as Error).message);
      } finally {
        setIsImporting(false);
      }
    };

    fileReader.readAsText(file);
  };

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('colegio_reacao_school_name', schoolName);
    localStorage.setItem('colegio_reacao_school_email', email);
    localStorage.setItem('colegio_reacao_school_address', address);
    localStorage.setItem('colegio_reacao_school_phone', phone);
    
    // Trigger storage event so other components can update
    window.dispatchEvent(new Event('storage'));
    
    // Save to Firebase as well if configured
    if (FirebaseService.isConfigured()) {
      try {
        await FirebaseService.settings.create({
          id: 'school_config',
          name: schoolName,
          email: email,
          address: address,
          phone: phone
        }, 'school_config');
        console.log('[Firebase] School configuration saved successfully to Firestore.');
      } catch (err) {
        console.error('[Firebase] Failed to save school config to Firestore:', err);
      }
    }
    
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

      {/* Sincronização & Migração de Dados panel */}
      <div className="bg-[#18181b] p-6 rounded-2xl border border-white/10 space-y-6 text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-[#f5c518]" />
            <div>
              <h2 className="font-bold text-white">Sincronização e Migração de Dados (Nuvem / Vercel)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Sincronize as informações cadastradas neste navegador com seu servidor na Nuvem/Vercel</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className={`w-2.5 h-2.5 rounded-full ${FirebaseService.isConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-semibold text-gray-300">
              {FirebaseService.isConfigured() ? 'Cloud Firebase Ativo 🔥' : 'Modo Local / Offline ⚡'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Export Section */}
          <div className="p-5 bg-[#0a0a0c]/50 rounded-xl border border-white/5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Download size={16} className="text-[#f5c518]" />
                1. Exportar Backup Local
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Baixe todas as informações atualmente salvas no seu navegador (como os usuários <strong>Arthur, Marianna</strong>, ordens de serviço, configurações de cabeçalho, funcionários e logs) em um único arquivo JSON seguro.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="w-full sm:w-auto bg-[#f5c518] hover:bg-amber-400 text-black font-bold text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/5 mt-auto self-start"
            >
              <Download size={15} />
              Exportar Arquivo de Backup
            </button>
          </div>

          {/* Import Section */}
          <div className="p-5 bg-[#0a0a0c]/50 rounded-xl border border-white/5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Upload size={16} className="text-[#f5c518]" />
                2. Importar e Sincronizar na Nuvem
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Envie o arquivo de backup baixado no passo 1. Se você estiver acessando pelo link de produção (Vercel), isto salvará os dados localmente <strong>e os enviará automaticamente para o banco de dados Firestore em nuvem</strong>, sincronizando instantaneamente todos os computadores.
              </p>
            </div>
            <div className="mt-auto pt-2">
              <label className="relative w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/15 font-bold text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer self-start">
                {isImporting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin text-[#f5c518]" />
                    Sincronizando Banco de Dados...
                  </>
                ) : (
                  <>
                    <Upload size={15} className="text-[#f5c518]" />
                    Selecionar e Sincronizar Backup
                  </>
                )}
                <input
                  type="file"
                  accept=".json"
                  disabled={isImporting}
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Explain Card */}
        <div className="flex gap-3 bg-[#f5c518]/5 border border-[#f5c518]/20 p-4 rounded-xl items-start">
          <AlertCircle size={18} className="text-[#f5c518] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-white">Por que isso é necessário?</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              O ambiente de desenvolvimento do AI Studio e o link publicado na Vercel operam em domínios de internet isolados. Por segurança, os navegadores impedem que um site leia os dados locais do outro. Ao usar o arquivo de backup, você transporta seus dados (Arthur, Marianna, escola e ordens) para o banco remoto no Firestore com um único clique!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
