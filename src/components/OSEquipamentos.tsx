/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Camera,
  Cpu, 
  MapPin, 
  Calendar, 
  Wrench, 
  Check, 
  AlertTriangle, 
  Trash2, 
  X,
  Edit2,
  TrendingUp,
  FileText,
  Share2,
  RotateCcw,
  History,
  PenTool,
  ClipboardList
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Equipamento, OrdemServico, Emprestimo, UserSession } from '../types';

interface OSEquipamentosProps {
  equipamentos: Equipamento[];
  ordens: OrdemServico[];
  emprestimos: Emprestimo[];
  user: UserSession;
  onAddEquipamento: (equip: Omit<Equipamento, 'id'>) => void;
  onEditEquipamento: (equip: Equipamento) => void;
  onDeleteEquipamento: (id: string) => void;
  onAddEmprestimo: (loan: Omit<Emprestimo, 'id'>) => void;
  onReturnEmprestimo: (id: string, returnObs: string, returnSignature: string) => void;
  onDeleteEmprestimo: (id: string) => void;
}

export default function OSEquipamentos({
  equipamentos,
  ordens,
  emprestimos,
  user,
  onAddEquipamento,
  onEditEquipamento,
  onDeleteEquipamento,
  onAddEmprestimo,
  onReturnEmprestimo,
  onDeleteEmprestimo
}: OSEquipamentosProps) {
  
  const [viewTab, setViewTab] = useState<'inventario' | 'emprestimos'>('inventario');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<Equipamento | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [loanToReturn, setLoanToReturn] = useState<Emprestimo | null>(null);
  const [deleteConfirmEquip, setDeleteConfirmEquip] = useState<Equipamento | null>(null);
  const [deleteConfirmLoan, setDeleteConfirmLoan] = useState<Emprestimo | null>(null);

  // Form states (Equipamento)
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Elétrico');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'operacional' | 'em_manutencao' | 'danificado' | 'aposentado'>('operacional');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [sectorCode, setSectorCode] = useState('');
  const [equipNumber, setEquipNumber] = useState('');
  const [conservationState, setConservationState] = useState('');
  const [equipObservations, setEquipObservations] = useState('');

  // Form states (Emprestimo)
  const [loanResponsible, setLoanResponsible] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanObs, setLoanObs] = useState('');
  const [loanEquipId, setLoanEquipId] = useState('');
  const sigPad = useRef<SignatureCanvas>(null);
  const returnSigPad = useRef<SignatureCanvas>(null);
  const [returnObs, setReturnObs] = useState('');

  // Handle opening of Add Modal
  const openAddModal = () => {
    setName('');
    setCategory('Elétrico');
    setLocation('');
    setStatus('operacional');
    setAcquisitionDate(new Date().toLocaleDateString('pt-BR'));
    setPhotoUrl('');
    setSectorCode('');
    setEquipNumber('');
    setConservationState('');
    setEquipObservations('');
    setShowAddModal(true);
  };

  // Handle opening of Edit Modal
  const openEditModal = (equip: Equipamento) => {
    setSelectedEquip(equip);
    setName(equip.name);
    setCategory(equip.category);
    setLocation(equip.location);
    setStatus(equip.status);
    setAcquisitionDate(equip.acquisitionDate);
    setPhotoUrl(equip.photoUrl || '');
    setSectorCode(equip.sectorCode || '');
    setEquipNumber(equip.number || '');
    setConservationState(equip.conservationState || '');
    setEquipObservations(equip.observations || '');
    setShowEditModal(true);
  };

  // Handle opening of Loan Modal
  const openLoanModal = () => {
    setLoanResponsible('');
    setLoanPurpose('');
    setLoanObs('');
    setLoanEquipId('');
    setShowLoanModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    onAddEquipamento({
      name,
      category,
      location,
      status,
      acquisitionDate,
      lastMaintenanceDate: undefined,
      photoUrl,
      sectorCode,
      number: equipNumber,
      conservationState,
      observations: equipObservations
    });
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquip) return;
    if (!name.trim() || !location.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    onEditEquipamento({
      ...selectedEquip,
      name,
      category,
      location,
      status,
      acquisitionDate,
      photoUrl,
      sectorCode,
      number: equipNumber,
      conservationState,
      observations: equipObservations
    });
    setShowEditModal(false);
    setSelectedEquip(null);
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanEquipId || !loanResponsible.trim() || !loanPurpose.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    if (sigPad.current?.isEmpty()) {
      alert('A assinatura digital é obrigatória!');
      return;
    }

    const selectedEquipment = equipamentos.find(eq => eq.id === loanEquipId);
    if (!selectedEquipment) return;

    const signatureData = sigPad.current?.getTrimmedCanvas().toDataURL('image/png') || '';

    onAddEmprestimo({
      equipId: loanEquipId,
      equipName: selectedEquipment.name,
      responsibleName: loanResponsible,
      withdrawalDate: new Date().toLocaleString('pt-BR'),
      purpose: loanPurpose,
      observations: loanObs,
      signatureUrl: signatureData,
      status: 'ativo'
    });

    setShowLoanModal(false);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanToReturn) return;

    if (returnSigPad.current?.isEmpty()) {
      alert('A assinatura digital é obrigatória para confirmar a devolução!');
      return;
    }

    const signatureData = returnSigPad.current?.getTrimmedCanvas().toDataURL('image/png') || '';

    onReturnEmprestimo(loanToReturn.id, returnObs, signatureData);
    setShowReturnModal(false);
    setLoanToReturn(null);
    setReturnObs('');
  };

  // Filter & Search Logic
  const filteredEquipamentos = useMemo(() => {
    return equipamentos.filter(eq => {
      const matchesSearch = eq.name.toLowerCase().includes(search.toLowerCase()) || 
                            eq.id.toLowerCase().includes(search.toLowerCase()) ||
                            eq.location.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || eq.category === categoryFilter;
      const matchesStatus = statusFilter === 'Todos' || eq.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [equipamentos, search, categoryFilter, statusFilter]);

  const filteredEmprestimos = useMemo(() => {
    return emprestimos.filter(emp => {
      const matchesSearch = emp.equipName.toLowerCase().includes(search.toLowerCase()) || 
                            emp.responsibleName.toLowerCase().includes(search.toLowerCase()) ||
                            emp.id.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [emprestimos, search]);

  // Unique categories list for filters
  const categories = useMemo(() => {
    const list = new Set(equipamentos.map(eq => eq.category));
    return ['Todos', ...Array.from(list)];
  }, [equipamentos]);

  // Linked maintenance history per equipment
  const getMaintenanceHistory = (equipId: string) => {
    return ordens.filter(o => o.equipId === equipId);
  };

  const getStatusBadge = (status: Equipamento['status']) => {
    switch (status) {
      case 'operacional':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Operacional</span>;
      case 'em_manutencao':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">Em Manutenção</span>;
      case 'danificado':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Danificado</span>;
      case 'aposentado':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/10">Aposentado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Actions Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <span className="w-1 h-6 bg-[#f5c518] rounded-full"></span>
            Gestão de Ativos e Empréstimos
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1 ml-3">Controle de inventário, localização e circulação de equipamentos</p>
        </div>

        <div className="flex gap-2">
          {viewTab === 'inventario' ? (
            <button
              onClick={openAddModal}
              className="bg-[#f5c518] hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-amber-500/10"
            >
              <Plus size={14} />
              Novo Equipamento
            </button>
          ) : (
            <button
              onClick={openLoanModal}
              className="bg-[#f5c518] hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-amber-500/10"
            >
              <Share2 size={14} />
              Registrar Empréstimo
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setViewTab('inventario')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            viewTab === 'inventario' ? 'border-[#f5c518] text-[#f5c518]' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Cpu size={16} />
          Inventário de Ativos
        </button>
        <button
          onClick={() => setViewTab('emprestimos')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            viewTab === 'emprestimos' ? 'border-[#f5c518] text-[#f5c518]' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <History size={16} />
          Controle de Empréstimos
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#18181b] p-4 rounded-xl border border-white/10">
        
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={viewTab === 'inventario' ? "Buscar por nome, código ou local..." : "Buscar por responsável ou equipamento..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-500"
          />
        </div>

        {viewTab === 'inventario' && (
          <>
            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#f5c518]"
              >
                <option disabled>Categoria</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#f5c518]"
              >
                <option value="Todos">Todos os Status</option>
                <option value="operacional">Operacional</option>
                <option value="em_manutencao">Em Manutenção</option>
                <option value="danificado">Danificado</option>
                <option value="aposentado">Aposentado</option>
              </select>
            </div>
          </>
        )}

      </div>

      {/* Tables Section */}
      <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden">
        {viewTab === 'inventario' ? (
          filteredEquipamentos.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Cpu size={40} className="mx-auto text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-300">Nenhum equipamento encontrado</h3>
              <p className="text-xs text-gray-500">Tente ajustar seus filtros de busca ou cadastre um novo item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-black/20 text-gray-400 font-medium text-xs border-b border-white/5 uppercase tracking-wider">
                    <th className="p-4">Cód ID</th>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Localização</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Histórico</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {filteredEquipamentos.map((equip) => {
                    const history = getMaintenanceHistory(equip.id);
                    return (
                      <tr key={equip.id} className="hover:bg-white/2">
                        <td className="p-4 font-mono text-xs text-[#f5c518] font-semibold">{equip.id}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {equip.photoUrl ? (
                              <img src={equip.photoUrl} alt={equip.name} className="w-10 h-10 rounded object-cover border border-white/10" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center border border-white/10">
                                <Cpu size={16} className="text-gray-600" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white">{equip.name}</div>
                              <div className="text-[11px] text-gray-500">Adquirido em {equip.acquisitionDate}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="bg-white/5 px-2 py-1 rounded text-xs text-gray-300 font-medium">{equip.category}</span>
                            {equip.sectorCode && (
                              <div className="text-[10px] text-[#f5c518] font-mono font-bold uppercase">{equip.sectorCode}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MapPin size={13} className="text-gray-500" />
                            <span>{equip.location}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(equip.status)}
                            {equip.conservationState && (
                              <span className="text-[10px] text-gray-400 italic">Est: {equip.conservationState}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              setSelectedEquip(equip);
                              setShowHistoryModal(true);
                            }}
                            className="flex items-center gap-1.5 text-xs text-[#f5c518] hover:text-amber-400 transition-colors font-medium cursor-pointer"
                          >
                            <Wrench size={13} />
                            <span>{history.length} {history.length === 1 ? 'manutenção' : 'manutenções'}</span>
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(equip)}
                              className="p-1.5 text-gray-400 hover:text-[#f5c518] hover:bg-white/5 rounded transition-all cursor-pointer"
                              title="Editar equipamento"
                            >
                              <Edit2 size={14} />
                            </button>
                            {(user.role === 'admin' || user.role === 'super_admin') && (
                              <button
                                onClick={() => setDeleteConfirmEquip(equip)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                title="Excluir equipamento"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Emprestimos Table */
          filteredEmprestimos.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Share2 size={40} className="mx-auto text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-300">Nenhum empréstimo registrado</h3>
              <p className="text-xs text-gray-500">Inicie um novo empréstimo clicando no botão acima.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-black/20 text-gray-400 font-medium text-xs border-b border-white/5 uppercase tracking-wider">
                    <th className="p-4">ID</th>
                    <th className="p-4">Responsável</th>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Retirada / Devolução</th>
                    <th className="p-4">Finalidade</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {filteredEmprestimos.map((loan) => (
                    <tr key={loan.id} className="hover:bg-white/2">
                      <td className="p-4 font-mono text-xs text-[#f5c518] font-semibold">{loan.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{loan.responsibleName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-200">{loan.equipName}</div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase">{loan.equipId}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Calendar size={12} className="text-emerald-500" />
                            <span>Retirada: {loan.withdrawalDate}</span>
                          </div>
                          {loan.returnDate && (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                              <RotateCcw size={12} className="text-blue-500" />
                              <span>Devolução: {loan.returnDate}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-300 max-w-[200px] truncate" title={loan.purpose}>{loan.purpose}</div>
                      </td>
                      <td className="p-4">
                        {loan.status === 'ativo' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">Em Aberto</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Devolvido</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {loan.status === 'ativo' ? (
                            <button
                              onClick={() => {
                                setLoanToReturn(loan);
                                setReturnObs('');
                                setShowReturnModal(true);
                              }}
                              className="bg-white/5 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <RotateCcw size={12} />
                              Devolver
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-600 font-bold px-3 py-1.5 border border-white/5 rounded-lg">CONCLUÍDO</span>
                          )}

                          {(user.role === 'admin' || user.role === 'super_admin') && (
                            <button
                              onClick={() => setDeleteConfirmLoan(loan)}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                              title="Excluir Registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modals Section */}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
              <h2 className="font-display font-bold text-white text-base">Novo Equipamento</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Photo Upload */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                  <Camera size={14} className="text-[#f5c518]" />
                  Foto do Equipamento
                </label>
                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#f5c518] hover:bg-white/5 transition-all group">
                      <Camera size={24} className="text-gray-500 group-hover:text-[#f5c518] transition-colors" />
                      <span className="text-[10px] text-gray-500 group-hover:text-gray-300 mt-1">Carregar Foto</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setPhotoUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Nome do Equipamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Impressora Laser Brother L2540"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  >
                    <option value="Elétrico">Elétrico</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Mobiliário">Mobiliário</option>
                    <option value="Informático">Informático</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Status Inicial *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  >
                    <option value="operacional">Operacional</option>
                    <option value="em_manutencao">Em Manutenção</option>
                    <option value="danificado">Danificado</option>
                    <option value="aposentado">Aposentado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Código do Setor</label>
                  <input
                    type="text"
                    placeholder="Ex: ADM-01"
                    value={sectorCode}
                    onChange={(e) => setSectorCode(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Número / Patrimônio</label>
                  <input
                    type="text"
                    placeholder="Ex: 00123"
                    value={equipNumber}
                    onChange={(e) => setEquipNumber(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Localização *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sala de Aula 102, Secretaria, etc."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Estado de Conservação</label>
                <input
                  type="text"
                  placeholder="Ex: Novo, Usado (Bom), Com avarias leves..."
                  value={conservationState}
                  onChange={(e) => setConservationState(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Data de Aquisição</label>
                  <input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Observações</label>
                <textarea
                  placeholder="Detalhes técnicos, garantias, etc."
                  value={equipObservations}
                  onChange={(e) => setEquipObservations(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] resize-none"
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
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Equipment Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
              <h2 className="font-display font-bold text-white text-base">Registrar Novo Empréstimo</h2>
              <button onClick={() => setShowLoanModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleLoanSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Selecionar Equipamento *</label>
                <select
                  required
                  value={loanEquipId}
                  onChange={(e) => setLoanEquipId(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                >
                  <option value="">Escolha um equipamento...</option>
                  {equipamentos
                    .filter(eq => eq.status === 'operacional')
                    .map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.location}) - {eq.id}
                      </option>
                    ))
                  }
                </select>
                <p className="text-[10px] text-gray-500 italic mt-1">Apenas equipamentos operacionais estão disponíveis para empréstimo.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Nome do Responsável *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo de quem está retirando"
                  value={loanResponsible}
                  onChange={(e) => setLoanResponsible(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Finalidade / Uso *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apresentação no Auditório, Reunião de Pais, etc."
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Observações Adicionais</label>
                <textarea
                  placeholder="Alguma nota importante sobre o estado ou entrega..."
                  value={loanObs}
                  onChange={(e) => setLoanObs(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] resize-none"
                />
              </div>

              {/* Digital Signature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <PenTool size={13} className="text-[#f5c518]" />
                    Assinatura Digital (Retirada) *
                  </label>
                  <button
                    type="button"
                    onClick={() => sigPad.current?.clear()}
                    className="text-[10px] text-red-400 hover:underline cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
                <div className="bg-white rounded-lg overflow-hidden border border-white/10 h-32">
                  <SignatureCanvas 
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  />
                </div>
                <p className="text-[10px] text-gray-500">Ao assinar acima, o responsável declara ciência da retirada e integridade do equipamento.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-black bg-[#f5c518] hover:bg-amber-400 transition-all cursor-pointer"
                >
                  Confirmar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Equipment Modal */}
      {showReturnModal && loanToReturn && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-emerald-500" />
                <h2 className="font-display font-bold text-white text-base">Confirmar Devolução</h2>
              </div>
              <button onClick={() => { setShowReturnModal(false); setLoanToReturn(null); }} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-5 space-y-4">
              
              <div className="bg-[#0a0a0c] p-3 rounded-lg border border-white/5 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 uppercase">Equipamento:</span>
                  <span className="text-white font-bold">{loanToReturn.equipName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 uppercase">Responsável:</span>
                  <span className="text-white font-bold">{loanToReturn.responsibleName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 uppercase">Data Retirada:</span>
                  <span className="text-emerald-400">{loanToReturn.withdrawalDate}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Observações da Devolução (Estado do item) *</label>
                <textarea
                  required
                  placeholder="Descreva o estado em que o equipamento foi devolvido..."
                  value={returnObs}
                  onChange={(e) => setReturnObs(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Digital Signature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <PenTool size={13} className="text-emerald-500" />
                    Assinatura do Responsável (Devolução) *
                  </label>
                  <button
                    type="button"
                    onClick={() => returnSigPad.current?.clear()}
                    className="text-[10px] text-red-400 hover:underline cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
                <div className="bg-white rounded-lg overflow-hidden border border-white/10 h-32">
                  <SignatureCanvas 
                    ref={returnSigPad}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 text-center">Assine para validar a devolução do item.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowReturnModal(false); setLoanToReturn(null); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check size={16} />
                  Finalizar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {showEditModal && selectedEquip && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
              <h2 className="font-display font-bold text-white text-base">Editar Equipamento: <span className="text-[#f5c518] font-mono">{selectedEquip.id}</span></h2>
              <button onClick={() => { setShowEditModal(false); setSelectedEquip(null); }} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Photo Upload */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                  <Camera size={14} className="text-[#f5c518]" />
                  Foto do Equipamento
                </label>
                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#f5c518] hover:bg-white/5 transition-all group">
                      <Camera size={24} className="text-gray-500 group-hover:text-[#f5c518] transition-colors" />
                      <span className="text-[10px] text-gray-500 group-hover:text-gray-300 mt-1">Carregar Foto</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setPhotoUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Nome do Equipamento *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  >
                    <option value="Elétrico">Elétrico</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Mobiliário">Mobiliário</option>
                    <option value="Informático">Informático</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  >
                    <option value="operacional">Operacional</option>
                    <option value="em_manutencao">Em Manutenção</option>
                    <option value="danificado">Danificado</option>
                    <option value="aposentado">Aposentado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Código do Setor</label>
                  <input
                    type="text"
                    placeholder="Ex: ADM-01"
                    value={sectorCode}
                    onChange={(e) => setSectorCode(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Número / Patrimônio</label>
                  <input
                    type="text"
                    placeholder="Ex: 00123"
                    value={equipNumber}
                    onChange={(e) => setEquipNumber(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Localização *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Estado de Conservação</label>
                <input
                  type="text"
                  placeholder="Ex: Novo, Usado (Bom), Com avarias leves..."
                  value={conservationState}
                  onChange={(e) => setConservationState(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Data de Aquisição</label>
                <input
                  type="text"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Observações</label>
                <textarea
                  placeholder="Detalhes técnicos, garantias, etc."
                  value={equipObservations}
                  onChange={(e) => setEquipObservations(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedEquip(null); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-black bg-[#f5c518] hover:bg-amber-400 transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance History Modal */}
      {showHistoryModal && selectedEquip && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-[#f5c518]" />
                <h2 className="font-display font-bold text-white text-base">
                  Histórico de OS: <span className="text-gray-300">{selectedEquip.name}</span>
                </h2>
              </div>
              <button onClick={() => { setShowHistoryModal(false); setSelectedEquip(null); }} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 max-h-[450px] overflow-y-auto space-y-4">
              {getMaintenanceHistory(selectedEquip.id).length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  Este equipamento não possui histórico de Ordens de Serviço cadastradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {getMaintenanceHistory(selectedEquip.id).map((os) => (
                    <div key={os.id} className="bg-black/20 p-3.5 rounded-lg border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#f5c518]">{os.id}</span>
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                            {os.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-medium">{os.problemDescription}</p>
                        <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                          <span>Abertura: {os.openingDate}</span>
                          {os.closingDate && <span>Conclusão: {os.closingDate}</span>}
                          <span>Resp: {os.responsible}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {os.status === 'concluido' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">Concluído</span>
                        ) : os.status === 'em_andamento' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/15">Em Andamento</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/15">Aberto</span>
                        )}
                        <span className="text-xs font-bold font-mono text-white">R$ {os.cost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
              <button
                onClick={() => { setShowHistoryModal(false); setSelectedEquip(null); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Equipment Deletion Confirmation Modal */}
      {deleteConfirmEquip && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-white">Excluir Equipamento</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente o equipamento <strong className="text-white">{deleteConfirmEquip.name}</strong>? Esta ação removerá seu histórico de manutenções e registros vinculados.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmEquip(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteEquipamento(deleteConfirmEquip.id);
                  setDeleteConfirmEquip(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Loan Deletion Confirmation Modal */}
      {deleteConfirmLoan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-white">Excluir Registro de Empréstimo</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja remover permanentemente o registro de empréstimo do ativo <strong className="text-white">{deleteConfirmLoan.equipName}</strong> para <strong className="text-white">{deleteConfirmLoan.responsibleName}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmLoan(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteEmprestimo(deleteConfirmLoan.id);
                  setDeleteConfirmLoan(null);
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
