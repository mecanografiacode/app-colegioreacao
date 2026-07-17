/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Headphones, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  X, 
  Send,
  AlertOctagon,
  User,
  ExternalLink,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { ChamadoSuporte, UserSession } from '../types';

interface OSSuporteProps {
  chamados: ChamadoSuporte[];
  user: UserSession;
  onAddChamado: (chamado: Omit<ChamadoSuporte, 'id'>) => void;
  onUpdateChamado: (chamado: ChamadoSuporte) => void;
  onDeleteChamado: (id: string) => void;
  currentUserEmail: string;
}

export default function OSSuporte({
  chamados,
  user,
  onAddChamado,
  onUpdateChamado,
  onDeleteChamado,
  currentUserEmail
}: OSSuporteProps) {

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ChamadoSuporte | null>(null);
  const [responseText, setResponseText] = useState('');
  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState<ChamadoSuporte | null>(null);

  // Add Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'rede' | 'computador' | 'impressora' | 'software' | 'outros'>('computador');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta' | 'critica'>('media');

  // Statistics
  const stats = useMemo(() => {
    return {
      total: chamados.length,
      aberto: chamados.filter(c => c.status === 'aberto').length,
      emAtendimento: chamados.filter(c => c.status === 'em_atendimento').length,
      resolvido: chamados.filter(c => c.status === 'resolvido').length,
      fechado: chamados.filter(c => c.status === 'fechado').length,
    };
  }, [chamados]);

  // Filtered tickets
  const filteredChamados = useMemo(() => {
    return chamados.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                            c.description.toLowerCase().includes(search.toLowerCase()) ||
                            c.id.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || c.category === categoryFilter;
      const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [chamados, search, categoryFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setTitle('');
    setDescription('');
    setCategory('computador');
    setPriority('media');
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Preencha os campos obrigatórios!');
      return;
    }
    onAddChamado({
      title,
      description,
      category,
      priority,
      status: 'aberto',
      openingDate: new Date().toLocaleDateString('pt-BR'),
      requester: currentUserEmail
    });
    setShowAddModal(false);
  };

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!responseText.trim()) {
      alert('Digite uma resposta válida.');
      return;
    }

    const updatedTicket: ChamadoSuporte = {
      ...selectedTicket,
      responseText: responseText.trim(),
      status: 'resolvido', // reply resolves it
      closingDate: new Date().toLocaleDateString('pt-BR')
    };

    onUpdateChamado(updatedTicket);
    setSelectedTicket(updatedTicket); // Refresh active detail
    setResponseText('');
  };

  const handleStatusChange = (status: ChamadoSuporte['status']) => {
    if (!selectedTicket) return;
    const updated: ChamadoSuporte = {
      ...selectedTicket,
      status,
      closingDate: (status === 'resolvido' || status === 'fechado') ? new Date().toLocaleDateString('pt-BR') : undefined
    };
    onUpdateChamado(updated);
    setSelectedTicket(updated);
  };

  const getPriorityBadge = (p: ChamadoSuporte['priority']) => {
    switch (p) {
      case 'baixa':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Baixa</span>;
      case 'media':
        return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Média</span>;
      case 'alta':
        return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Alta</span>;
      case 'critica':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Crítica</span>;
    }
  };

  const getStatusBadge = (status: ChamadoSuporte['status']) => {
    switch (status) {
      case 'aberto':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/20">Aberto</span>;
      case 'em_atendimento':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">Em Atendimento</span>;
      case 'resolvido':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolvido</span>;
      case 'fechado':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/10">Fechado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <span className="w-1 h-6 bg-[#f5c518] rounded-full"></span>
            Central de Suporte TI
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1 ml-3">Chamados de rede, computadores e suporte de infraestrutura escolar</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-[#f5c518] hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-amber-500/10"
        >
          <Plus size={14} />
          Abrir Chamado
        </button>
      </div>

      <div className="h-px bg-white/10" />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#18181b] p-3.5 rounded-xl border border-white/5 text-center">
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total de Chamados</div>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-[#18181b] p-3.5 rounded-xl border border-white/5 text-center">
          <div className="text-[10px] text-[#f5c518] font-semibold uppercase tracking-wider">Aberto</div>
          <div className="text-2xl font-black text-[#f5c518] mt-1">{stats.aberto}</div>
        </div>
        <div className="bg-[#18181b] p-3.5 rounded-xl border border-white/5 text-center">
          <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Em Atendimento</div>
          <div className="text-2xl font-black text-orange-400 mt-1">{stats.emAtendimento}</div>
        </div>
        <div className="bg-[#18181b] p-3.5 rounded-xl border border-white/5 text-center">
          <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Resolvido</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.resolvido}</div>
        </div>
        <div className="bg-[#18181b] p-3.5 rounded-xl border border-white/5 text-center col-span-2 md:col-span-1">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Fechado</div>
          <div className="text-2xl font-black text-gray-300 mt-1">{stats.fechado}</div>
        </div>
      </div>

      {/* Main Grid: List left, detail right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left column: List & filters */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#18181b] p-3 rounded-xl border border-white/10">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar chamado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0a0a0c] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#f5c518]"
            >
              <option value="Todos">Todas Categorias</option>
              <option value="rede">Redes / Wi-Fi</option>
              <option value="computador">Computadores</option>
              <option value="impressora">Impressoras</option>
              <option value="software">Softwares</option>
              <option value="outros">Outros</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0a0a0c] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#f5c518]"
            >
              <option value="Todos">Todos os Status</option>
              <option value="aberto">Aberto</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>

          {/* Ticket Cards List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredChamados.length === 0 ? (
              <div className="bg-[#18181b] rounded-xl border border-white/5 p-12 text-center text-gray-500 space-y-2">
                <Headphones size={30} className="mx-auto text-gray-600" />
                <p className="text-xs">Nenhum chamado de suporte encontrado para esta filtragem.</p>
              </div>
            ) : (
              filteredChamados.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setResponseText('');
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left
                    ${selectedTicket?.id === ticket.id
                      ? 'bg-[#1e1d1a]/80 border-[#f5c518]/30 shadow-md' 
                      : 'bg-[#18181b] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-[#f5c518]">{ticket.id}</span>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white mb-1.5 line-clamp-1">{ticket.title}</h3>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">{ticket.description}</p>
                  
                  <div className="h-px bg-white/5 my-2.5" />

                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                    <span className="capitalize">Categoria: <strong className="text-gray-400">{ticket.category}</strong></span>
                    <span>Abertura: <strong className="text-gray-400">{ticket.openingDate}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Ticket detailed viewer */}
        <div className="lg:col-span-5">
          {selectedTicket ? (
            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs text-[#f5c518] font-bold">{selectedTicket.id}</span>
                  <h2 className="text-xs font-bold text-white leading-tight">{selectedTicket.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/5"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Action Buttons for Admins */}
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <div className="flex justify-end border-b border-white/5 pb-3">
                  <button
                    onClick={() => setDeleteConfirmTicket(selectedTicket)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                    EXCLUIR CHAMADO
                  </button>
                </div>
              )}

              {/* Status and dates details */}
              <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-lg border border-white/5 text-[11px] text-gray-300">
                <div>
                  <span className="text-gray-500">Solicitante:</span>
                  <div className="font-semibold text-white flex items-center gap-1 mt-0.5">
                    <User size={10} className="text-gray-500" />
                    <span className="truncate">{selectedTicket.requester}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Categoria:</span>
                  <div className="font-semibold text-white capitalize mt-0.5">{selectedTicket.category}</div>
                </div>
                <div>
                  <span className="text-gray-500">Data de Abertura:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedTicket.openingDate}</div>
                </div>
                <div>
                  <span className="text-gray-500">Data de Resolução:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedTicket.closingDate || 'Pendente'}</div>
                </div>
              </div>

              {/* Description body */}
              <div className="space-y-1 text-left">
                <h4 className="text-[10px] uppercase font-bold text-gray-500">Descrição do Problema</h4>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-xs text-gray-200 leading-relaxed max-h-[120px] overflow-y-auto">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Response block */}
              {selectedTicket.responseText && (
                <div className="space-y-1 text-left">
                  <h4 className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1">
                    <MessageSquare size={11} />
                    Solução Registrada
                  </h4>
                  <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/15 text-xs text-emerald-300 leading-relaxed">
                    {selectedTicket.responseText}
                  </div>
                </div>
              )}

              {/* Interaction Panel */}
              <div className="pt-2 border-t border-white/5 space-y-3.5 text-left">
                <h4 className="text-[10px] uppercase font-bold text-gray-500">Ações do Atendimento</h4>
                
                {/* State transitioning buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedTicket.status === 'aberto' && (
                    <button
                      onClick={() => handleStatusChange('em_atendimento')}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                    >
                      Iniciar Atendimento
                    </button>
                  )}
                  {selectedTicket.status === 'em_atendimento' && (
                    <span className="text-xs text-gray-400">Atendimento em curso...</span>
                  )}
                  {selectedTicket.status === 'resolvido' && (
                    <button
                      onClick={() => handleStatusChange('fechado')}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                    >
                      Fechar Chamado (Arquivar)
                    </button>
                  )}
                  {selectedTicket.status === 'fechado' && (
                    <span className="text-xs text-gray-500">Chamado encerrado.</span>
                  )}
                </div>

                {/* Response Entry Box */}
                {(selectedTicket.status === 'aberto' || selectedTicket.status === 'em_atendimento') && (
                  <form onSubmit={handleResponseSubmit} className="space-y-2">
                    <textarea
                      placeholder="Registrar resposta do TI ou solução do problema..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={3}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-500 leading-relaxed"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                    >
                      <Send size={12} />
                      Concluir & Responder
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#18181b] p-8 rounded-xl border border-white/10 text-center text-gray-500 py-16 space-y-2">
              <MessageSquare size={26} className="mx-auto text-gray-600" />
              <h3 className="text-xs font-semibold text-gray-300">Nenhum chamado selecionado</h3>
              <p className="text-[11px]">Selecione um chamado na lista ao lado para ver detalhes, registrar respostas de atendimento e fechar chamados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
              <h2 className="font-display font-bold text-white text-base">Abrir Chamado de Suporte</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Título / Assunto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Impressora da Coordenação sem Wi-Fi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  >
                    <option value="rede">Rede / Wi-Fi</option>
                    <option value="computador">Computadores</option>
                    <option value="impressora">Impressoras</option>
                    <option value="software">Sistemas / Softwares</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Prioridade *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Descrição Detalhada *</label>
                <textarea
                  required
                  placeholder="Descreva o problema com detalhes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-black bg-[#f5c518] hover:bg-amber-400 transition-all cursor-pointer"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Support Ticket Deletion Confirmation Modal */}
      {deleteConfirmTicket && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-white">Excluir Chamado Técnico</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja deletar definitivamente o chamado técnico de código <strong className="text-white font-mono">{deleteConfirmTicket.id}</strong>? Esta ação é irreversível.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTicket(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteChamado(deleteConfirmTicket.id);
                  setSelectedTicket(null);
                  setDeleteConfirmTicket(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
