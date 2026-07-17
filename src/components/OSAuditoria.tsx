/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ShieldAlert, Search, Calendar, RefreshCw, FileText, Cpu, Headphones, Users, Lock, Eye, UserCheck } from 'lucide-react';
import { LogAuditoria, UserSession } from '../types';

interface OSAuditoriaProps {
  logs: LogAuditoria[];
  logsFuncionarios?: LogAuditoria[];
  user?: UserSession | null;
}

export default function OSAuditoria({ logs, logsFuncionarios = [], user }: OSAuditoriaProps) {
  const staffEmails = ['arthurrfgomes@gmail.com', 'colinaadm201@gmail.com'].map(e => e.toLowerCase());
  const isStaffUser = user && staffEmails.includes(user.email.toLowerCase());

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [auditTab, setAuditTab] = useState<'geral' | 'funcionarios'>(isStaffUser ? 'funcionarios' : 'geral');

  // Filter logs based on active tab
  const activeLogs = auditTab === 'funcionarios' ? logsFuncionarios : logs;

  const filteredLogs = useMemo(() => {
    // Sort logs newest first
    const sorted = [...activeLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    return sorted.filter(log => {
      const matchesSearch = log.userName.toLowerCase().includes(search.toLowerCase()) || 
                            log.action.toLowerCase().includes(search.toLowerCase()) ||
                            log.details.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'Todos' || log.targetType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [activeLogs, search, typeFilter]);

  const getTargetIcon = (type: LogAuditoria['targetType']) => {
    switch (type) {
      case 'os':
        return <FileText size={14} className="text-[#f5c518]" />;
      case 'equipamento':
        return <Cpu size={14} className="text-blue-400" />;
      case 'suporte':
        return <Headphones size={14} className="text-orange-400" />;
      case 'funcionario':
        return <Users size={14} className="text-purple-400" />;
      case 'ponto':
        return <Calendar size={14} className="text-emerald-400" />;
      case 'config':
        return <Lock size={14} className="text-gray-400" />;
      case 'sistema':
        return <ShieldAlert size={14} className="text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <span className="w-1 h-6 bg-[#f5c518] rounded-full"></span>
            Logs de Segurança e Auditoria
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1 ml-3">Histórico completo de ações, alterações e acessos realizados no sistema por operadores</p>
        </div>
      </div>

      {/* Tabs for Special Users */}
      {isStaffUser && (
        <div className="flex items-center gap-2 border-b border-white/5 pb-1">
          <button
            onClick={() => setAuditTab('funcionarios')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              auditTab === 'funcionarios' 
              ? 'text-[#f5c518] border-[#f5c518] bg-[#f5c518]/5' 
              : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <Users size={14} />
            AUDITORIA DE FUNCIONÁRIOS
          </button>
          <button
            onClick={() => setAuditTab('geral')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              auditTab === 'geral' 
              ? 'text-[#f5c518] border-[#f5c518] bg-[#f5c518]/5' 
              : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <ShieldAlert size={14} />
            AUDITORIA GERAL
          </button>
        </div>
      )}

      {/* Filters Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#18181b] p-4 rounded-xl border border-white/10">
        
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={`Buscar na auditoria ${auditTab === 'funcionarios' ? 'de funcionários' : 'geral'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-500"
          />
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#f5c518]"
          >
            <option value="Todos">Todas as Áreas</option>
            <option value="os">Ordens de Serviço</option>
            <option value="equipamento">Equipamentos</option>
            <option value="suporte">Suporte Técnico</option>
            <option value="funcionario">Funcionários</option>
            <option value="ponto">Registros de Ponto</option>
            <option value="config">Configurações</option>
            <option value="sistema">Segurança / Usuários</option>
          </select>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            {auditTab === 'funcionarios' ? (
              <UserCheck size={40} className="mx-auto text-gray-600" />
            ) : (
              <ShieldAlert size={40} className="mx-auto text-gray-600" />
            )}
            <h3 className="text-sm font-semibold text-gray-300">Nenhum evento registrado</h3>
            <p className="text-xs text-gray-500">Nenhum log corresponde aos critérios de pesquisa atuais.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-black/20 text-gray-400 font-medium text-xs border-b border-white/5 uppercase tracking-wider">
                  <th className="p-4 w-[180px]">Data / Hora</th>
                  <th className="p-4 w-[160px]">Operador</th>
                  <th className="p-4 w-[100px]">Área</th>
                  <th className="p-4">Ação</th>
                  <th className="p-4">Descrição do Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/2 align-top">
                    <td className="p-4 font-mono text-xs text-gray-400">{log.timestamp}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white text-xs">{log.userName}</div>
                      <div className="text-[10px] text-gray-500 font-mono">ID: {log.userId}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 uppercase tracking-wide text-[9px] font-bold">
                        {getTargetIcon(log.targetType)}
                        <span className="text-gray-400">{log.targetType}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-200">
                      {log.action}
                    </td>
                    <td className="p-4 text-xs text-gray-400 leading-relaxed font-normal">
                      {log.details}
                      {log.targetId && (
                        <div className="mt-1 text-[10px] font-mono text-[#f5c518]">
                          ID de Referência: {log.targetId}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
