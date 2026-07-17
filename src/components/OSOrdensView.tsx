/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Wrench, 
  Check, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  Calendar, 
  FileSpreadsheet, 
  Trash2, 
  X,
  Edit2,
  TrendingUp,
  FileText,
  DollarSign,
  Printer,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { OrdemServico, Equipamento } from '../types';
import OSDashboard from './OSDashboard';

interface OSOrdensViewProps {
  ordens: OrdemServico[];
  equipamentos: Equipamento[];
  onAddOS: (os: Omit<OrdemServico, 'id'>) => void;
  onUpdateOS: (os: OrdemServico) => void;
  onDeleteOS: (id: string) => void;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  userRole: 'super_admin' | 'admin' | 'operator' | 'guest';
  schoolName: string;
}

export default function OSOrdensView({
  ordens,
  equipamentos,
  onAddOS,
  onUpdateOS,
  onDeleteOS,
  activeSubTab,
  setActiveSubTab,
  userRole,
  schoolName
}: OSOrdensViewProps) {
  
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
  const [deleteConfirmOS, setDeleteConfirmOS] = useState<OrdemServico | null>(null);
  const [unarchiveConfirmOS, setUnarchiveConfirmOS] = useState<OrdemServico | null>(null);
  const [deletePermanentConfirmOS, setDeletePermanentConfirmOS] = useState<OrdemServico | null>(null);

  // Archive state
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  // Add Form state
  const [selectedEquipId, setSelectedEquipId] = useState(equipamentos[0]?.id || '');
  const [addTitle, setAddTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [addCategory, setAddCategory] = useState('');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta' | 'critica'>('media');
  const [addLocation, setAddLocation] = useState('');
  const [addRequester, setAddRequester] = useState('');
  const [addObservations, setAddObservations] = useState('');
  const [addPhotoUrl, setAddPhotoUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [responsible, setResponsible] = useState('');
  const [cost, setCost] = useState(0);

  // Complete Form cost state
  const [completionCost, setCompletionCost] = useState('0');

  // Webcam Camera Stream and Capture References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      alert('Não foi possível acessar a câmera do dispositivo. Por favor, utilize o upload de arquivos.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        if (showEditModal && editingOS) {
          setEditingOS({ ...editingOS, photoUrl: dataUrl });
        } else {
          setAddPhotoUrl(dataUrl);
        }
      }
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Filter list depending on active sub-tab (Ordens, Relatórios, Arquivo)
  const currentOrdens = useMemo(() => {
    let list = [...ordens];
    
    // Sub-tab split
    if (activeSubTab === 'ordens') {
      // Show active (Aberto, Em Andamento, Concluido not archived)
      list = list.filter(o => o.status !== 'arquivado');
    } else if (activeSubTab === 'arquivo') {
      // Show only archived
      list = list.filter(o => o.status === 'arquivado');
    }

    // Filters & search
    return list.filter(o => {
      const matchesSearch = o.equipName.toLowerCase().includes(search.toLowerCase()) || 
                            o.id.toLowerCase().includes(search.toLowerCase()) ||
                            o.problemDescription.toLowerCase().includes(search.toLowerCase());
      const matchesPriority = priorityFilter === 'Todos' || o.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'Todos' || o.category === categoryFilter;
      return matchesSearch && matchesPriority && matchesCategory;
    });
  }, [ordens, activeSubTab, search, priorityFilter, categoryFilter]);

  // Unique categories list
  const categories = ['Todos', 'Elétrico', 'Manutenção', 'Mobiliário', 'Informático'];

  // Handle opening New OS form
  const handleOpenAdd = () => {
    if (equipamentos.length === 0) {
      alert('Cadastre um equipamento antes de criar uma Ordem de Serviço!');
      return;
    }
    const firstEquip = equipamentos[0];
    setSelectedEquipId(firstEquip.id);
    setAddTitle('');
    setProblemDescription('');
    setAddCategory(firstEquip.category);
    setPriority('media');
    setAddLocation(firstEquip.location);
    setAddRequester('');
    setAddObservations('');
    setAddPhotoUrl('');
    setIsCapturing(false);
    setResponsible('');
    setCost(0);
    setShowAddModal(true);
  };

  const handleAddEquipChange = (equipId: string) => {
    setSelectedEquipId(equipId);
    const equip = equipamentos.find(eq => eq.id === equipId);
    if (equip) {
      setAddCategory(equip.category);
      setAddLocation(equip.location);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !problemDescription.trim() || !responsible.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (Título, Descrição e Responsável)!');
      return;
    }

    const equip = equipamentos.find(eq => eq.id === selectedEquipId);
    if (!equip) return;

    onAddOS({
      title: addTitle.trim(),
      equipId: equip.id,
      equipName: equip.name,
      category: addCategory.trim() || equip.category,
      problemDescription: problemDescription.trim(),
      status: 'aberto',
      priority,
      responsible: responsible.trim(),
      openingDate: new Date().toLocaleDateString('pt-BR'),
      cost: Number(cost) || 0,
      location: addLocation.trim() || equip.location,
      requester: addRequester.trim(),
      observations: addObservations.trim(),
      photoUrl: addPhotoUrl
    });

    setShowAddModal(false);
  };

  const handleStatusTransition = (os: OrdemServico, nextStatus: OrdemServico['status']) => {
    if (nextStatus === 'concluido') {
      const costPrompt = prompt('Digite o custo final da manutenção em R$:', os.cost.toString());
      if (costPrompt === null) return; // cancel
      const finalCost = parseFloat(costPrompt.replace(',', '.')) || 0;
      onUpdateOS({
        ...os,
        status: 'concluido',
        cost: finalCost,
        closingDate: new Date().toLocaleDateString('pt-BR')
      });
    } else {
      onUpdateOS({
        ...os,
        status: nextStatus
      });
    }
  };

  // Edit OS Handlers
  const handleOpenEdit = (os: OrdemServico) => {
    setEditingOS({
      ...os,
      title: os.title || '',
      location: os.location || '',
      category: os.category || '',
      requester: os.requester || '',
      observations: os.observations || '',
      photoUrl: os.photoUrl || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOS) return;
    if (!(editingOS.title || '').trim() || !editingOS.problemDescription.trim() || !editingOS.responsible.trim()) {
      alert('Por favor, preencha os campos obrigatórios (Título, Descrição e Responsável)!');
      return;
    }
    onUpdateOS(editingOS);
    setShowEditModal(false);
    setEditingOS(null);
  };

  const handleEditEquipChange = (equipId: string) => {
    const equip = equipamentos.find(eq => eq.id === equipId);
    if (equip && editingOS) {
      setEditingOS({
        ...editingOS,
        equipId: equip.id,
        equipName: equip.name,
        category: equip.category,
        location: equip.location
      });
    }
  };

  // Helper to extract Month/Year in Portuguese
  const getMonthYearString = (dateStr: string) => {
    if (!dateStr) return 'Mês Indefinido';
    const parts = dateStr.split('/');
    if (parts.length < 2) return 'Mês Indefinido';
    const monthNum = parseInt(parts[1], 10);
    const year = parts[2] || new Date().getFullYear().toString();
    
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const monthName = months[monthNum - 1] || 'Indefinido';
    return `${monthName} de ${year}`;
  };

  // Group archived orders by month
  const archivedByMonth = useMemo(() => {
    const groups: { [key: string]: OrdemServico[] } = {};
    const archivedList = ordens.filter(o => o.status === 'arquivado');
    
    archivedList.forEach(o => {
      const monthYear = getMonthYearString(o.openingDate);
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(o);
    });
    
    return groups;
  }, [ordens]);

  // Badging utilities
  const getStatusBadge = (status: OrdemServico['status']) => {
    switch (status) {
      case 'aberto':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Aberto</span>;
      case 'em_andamento':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">Em Andamento</span>;
      case 'concluido':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Concluída</span>;
      case 'arquivado':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/10">Arquivada</span>;
    }
  };

  const getPriorityColor = (p: OrdemServico['priority']) => {
    switch (p) {
      case 'baixa': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'media': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'alta': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'critica': return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  // Report statistics and generators for "Relatórios" horizontal tab
  const reportStats = useMemo(() => {
    const totalCount = ordens.length;
    const completedList = ordens.filter(o => o.status === 'concluido');
    const completedCount = completedList.length;
    const pendingCount = ordens.filter(o => o.status === 'aberto' || o.status === 'em_andamento').length;
    const totalCost = completedList.reduce((sum, o) => sum + o.cost, 0);

    return { totalCount, completedCount, pendingCount, totalCost };
  }, [ordens]);

  return (
    <div className="space-y-6">
      
      {/* Header with Tabs and Global Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        {/* Horizonal pill tabs inside Ordens de Serviço */}
        <div className="inline-flex p-1 bg-[#18181b] rounded-full border border-white/5 space-x-1">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
              ${activeSubTab === 'dashboard' 
                ? 'bg-[#0a0a0a] border border-white/10 text-white shadow-sm' 
                : 'text-[#a1a1aa] hover:text-white font-medium'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab('ordens')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
              ${activeSubTab === 'ordens' 
                ? 'bg-[#0a0a0a] border border-white/10 text-white shadow-sm' 
                : 'text-[#a1a1aa] hover:text-white font-medium'}`}
          >
            Ordens
          </button>
          <button
            onClick={() => setActiveSubTab('relatorios')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
              ${activeSubTab === 'relatorios' 
                ? 'bg-[#0a0a0a] border border-white/10 text-white shadow-sm' 
                : 'text-[#a1a1aa] hover:text-white font-medium'}`}
          >
            Relatórios
          </button>
          <button
            onClick={() => setActiveSubTab('arquivo')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
              ${activeSubTab === 'arquivo' 
                ? 'bg-[#0a0a0a] border border-white/10 text-white shadow-sm' 
                : 'text-[#a1a1aa] hover:text-white font-medium'}`}
          >
            Arquivo
          </button>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#f5c518] hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10"
        >
          <Plus size={14} />
          Nova Ordem de Serviço
        </button>
      </div>

      {/* RENDER ACTIVE TAB: Dashboard */}
      {activeSubTab === 'dashboard' && (
        <OSDashboard ordens={ordens} />
      )}

      {/* RENDER ACTIVE TAB: Ordens */}
      {activeSubTab === 'ordens' && (
        <div className="space-y-4 text-left no-print">
          
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-white capitalize">
                <span className="w-1 h-5 bg-[#f5c518] rounded-full"></span>
                Ordens de Serviço Ativas
              </h2>
              <p className="text-[11px] text-[#a1a1aa] mt-1 ml-3">Total de {currentOrdens.length} registros listados</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#18181b] p-3 rounded-xl border border-white/10 text-xs">
            
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por equipamento, código ou problema..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-500"
              />
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-[#f5c518]"
              >
                <option value="Todos">Todas Prioridades</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-[#f5c518]"
              >
                <option value="Todos">Todas Categorias</option>
                <option value="Elétrico">Elétrico</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Mobiliário">Mobiliário</option>
                <option value="Informático">Informático</option>
              </select>
            </div>

          </div>

          {/* OS Table */}
          <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden">
            {currentOrdens.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Wrench size={32} className="mx-auto text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-300">Nenhuma Ordem de Serviço encontrada</h3>
                <p className="text-xs text-gray-500">Nenhum registro corresponde aos filtros ou buscas aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-black/20 text-gray-400 font-medium border-b border-white/5 uppercase tracking-wider">
                      <th className="p-4 w-[110px]">Cód OS</th>
                      <th className="p-4">Equipamento</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Responsável</th>
                      <th className="p-4">Data Abertura</th>
                      <th className="p-4">Custo</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {currentOrdens.map((os) => (
                      <tr key={os.id} className="hover:bg-white/2">
                        <td className="p-4 font-mono font-bold text-[#f5c518]">{os.id}</td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{os.equipName}</div>
                          <div className="text-[10px] text-gray-400 font-normal line-clamp-1 truncate max-w-[200px]" title={os.problemDescription}>
                            {os.problemDescription}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-white/5 px-2 py-0.5 rounded text-gray-300 font-medium">{os.category}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-1">
                            {getStatusBadge(os.status)}
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${getPriorityColor(os.priority)}`}>
                              {os.priority}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-gray-300">{os.responsible}</td>
                        <td className="p-4 text-gray-400">{os.openingDate}</td>
                        <td className="p-4 font-mono text-white font-semibold">
                          {os.cost > 0 ? `R$ ${os.cost.toFixed(2)}` : 'R$ 0,00'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedOS(os);
                                setShowDetailModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
                              title="Visualizar detalhes"
                            >
                              <Eye size={13} />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(os)}
                              className="p-1.5 text-gray-400 hover:text-[#f5c518] hover:bg-white/5 rounded transition-all cursor-pointer"
                              title="Editar Ordem de Serviço"
                            >
                              <Edit2 size={13} />
                            </button>
                            
                            {os.status === 'aberto' && (
                              <button
                                onClick={() => handleStatusTransition(os, 'em_andamento')}
                                className="p-1 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white rounded text-[10px] px-2 font-bold transition-all cursor-pointer"
                                title="Iniciar reparo"
                              >
                                Iniciar
                              </button>
                            )}

                            {os.status === 'em_andamento' && (
                              <button
                                onClick={() => handleStatusTransition(os, 'concluido')}
                                className="p-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded text-[10px] px-2 font-bold transition-all cursor-pointer"
                                title="Concluir manutenção"
                              >
                                Concluir
                              </button>
                            )}

                            {os.status === 'concluido' && activeSubTab === 'ordens' && (
                              <button
                                onClick={() => onUpdateOS({ ...os, status: 'arquivado' })}
                                className="p-1 bg-gray-500/15 text-gray-400 hover:bg-white/10 rounded text-[10px] px-2 font-semibold transition-all cursor-pointer"
                                title="Arquivar OS"
                              >
                                Arquivar
                              </button>
                            )}

                            {(userRole === 'admin' || userRole === 'super_admin') && (
                              <button
                                onClick={() => setDeleteConfirmOS(os)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                title="Deletar OS"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
                                setSelectedOS(os);
                                setTimeout(() => window.print(), 100);
                              }}
                              className="p-1.5 text-gray-400 hover:text-[#f5c518] hover:bg-white/5 rounded transition-all cursor-pointer"
                              title="Imprimir OS"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER ACTIVE TAB: Arquivo (Organizado por Mês) */}
      {activeSubTab === 'arquivo' && (
        <div className="space-y-6 text-left no-print">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="w-1 h-6 bg-[#f5c518] rounded-full"></span>
              Arquivo Histórico Mensal
            </h2>
            <p className="text-xs text-[#a1a1aa] mt-1 ml-3">
              Ordens de serviço arquivadas agrupadas cronologicamente por mês de registro para prestação de contas
            </p>
          </div>

          {Object.keys(archivedByMonth).length === 0 ? (
            <div className="bg-[#18181b] p-16 text-center space-y-3 rounded-xl border border-white/10">
              <Calendar size={32} className="mx-auto text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-300">Nenhum registro arquivado</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                As ordens de serviço concluídas que forem arquivadas serão agrupadas por mês e salvas de forma segura nesta seção.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(archivedByMonth).sort((a, b) => {
                // simple chronological sort helper (reverse)
                return b.localeCompare(a);
              }).map(monthKey => {
                const monthOrdens = archivedByMonth[monthKey];
                const totalCost = monthOrdens.reduce((sum, o) => sum + o.cost, 0);
                const isExpanded = openMonth === monthKey;

                return (
                  <div key={monthKey} className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden transition-all">
                    
                    {/* Month Header row */}
                    <button
                      onClick={() => setOpenMonth(isExpanded ? null : monthKey)}
                      className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-black/20 hover:bg-black/40 gap-3 text-left transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#f5c518]/10 text-[#f5c518] rounded-lg border border-[#f5c518]/20">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{monthKey}</h3>
                          <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                            {monthOrdens.length} {monthOrdens.length === 1 ? 'Ordem arquivada' : 'Ordens arquivadas'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between border-t border-white/5 pt-2 sm:pt-0 sm:border-0">
                        <div className="text-right">
                          <span className="text-[9px] text-gray-500 uppercase font-bold block">Investimento no Mês</span>
                          <span className="text-sm font-bold font-mono text-[#f5c518]">R$ {totalCost.toFixed(2)}</span>
                        </div>
                        <div className="text-gray-400 p-1 bg-white/5 rounded hover:text-white transition-all">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </button>

                    {/* Collapsible content (Table) */}
                    {isExpanded && (
                      <div className="p-4 border-t border-white/5 bg-black/10 space-y-4">
                        
                        {/* Month Actions row */}
                        <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5 text-xs">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase">Registros de {monthKey}</span>
                          <button
                            onClick={() => {
                              alert(`Exportando planilha de registros do mês de ${monthKey}...`);
                            }}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <FileSpreadsheet size={12} className="text-emerald-400" />
                            Planilha Mensal
                          </button>
                        </div>

                        {/* Month Table */}
                        <div className="overflow-x-auto rounded-lg border border-white/5">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-black/30 text-gray-400 font-semibold border-b border-white/5 uppercase text-[9px] tracking-wider">
                                <th className="p-3">Código</th>
                                <th className="p-3">Equipamento</th>
                                <th className="p-3">Categoria</th>
                                <th className="p-3">Responsável</th>
                                <th className="p-3">Abertura</th>
                                <th className="p-3">Custo</th>
                                <th className="p-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                              {monthOrdens.map(os => (
                                <tr key={os.id} className="hover:bg-white/2">
                                  <td className="p-3 font-mono font-bold text-[#f5c518]">{os.id}</td>
                                  <td className="p-3">
                                    <div className="font-semibold text-white">{os.equipName}</div>
                                    <div className="text-[10px] text-gray-400 truncate max-w-[200px]" title={os.problemDescription}>
                                      {os.problemDescription}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="bg-white/5 px-1.5 py-0.2 rounded text-gray-400 text-[10px]">{os.category}</span>
                                  </td>
                                  <td className="p-3 font-medium text-gray-300">{os.responsible}</td>
                                  <td className="p-3 text-gray-400">{os.openingDate}</td>
                                  <td className="p-3 font-mono font-bold text-white">R$ {os.cost.toFixed(2)}</td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => {
                                          setSelectedOS(os);
                                          setShowDetailModal(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
                                        title="Visualizar Detalhes"
                                      >
                                        <Eye size={12} />
                                      </button>
                                      
                                      <button
                                        onClick={() => setUnarchiveConfirmOS(os)}
                                        className="p-1 text-gray-400 hover:text-[#f5c518] hover:bg-white/5 rounded transition-all cursor-pointer"
                                        title="Desarquivar OS"
                                      >
                                        <RotateCcw size={12} />
                                      </button>

                                      {(userRole === 'admin' || userRole === 'super_admin') && (
                                        <button
                                          onClick={() => setDeletePermanentConfirmOS(os)}
                                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                          title="Deletar permanentemente"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* RENDER ACTIVE TAB: Relatórios */}
      {activeSubTab === 'relatorios' && (
        <div className="space-y-6 text-left no-print">
          <div>
            <h2 className="text-lg font-bold text-white">Relatórios Financeiros e Produtividade</h2>
            <p className="text-[11px] text-gray-400">Dados consolidados do histórico de todas as OS registradas no sistema</p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#18181b] p-4.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Total de Ordens Registradas</span>
              <div className="text-2xl font-black text-white mt-1">{reportStats.totalCount}</div>
            </div>
            <div className="bg-[#18181b] p-4.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">Ordens Concluídas</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{reportStats.completedCount}</div>
            </div>
            <div className="bg-[#18181b] p-4.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-orange-400 uppercase font-semibold">Ordens Pendentes / Curso</span>
              <div className="text-2xl font-black text-orange-400 mt-1">{reportStats.pendingCount}</div>
            </div>
            <div className="bg-[#18181b] p-4.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-[#f5c518] uppercase font-semibold">Investimento Total Manutenção</span>
              <div className="text-xl font-black text-[#f5c518] mt-1">R$ {reportStats.totalCost.toFixed(2)}</div>
            </div>
          </div>

          {/* Detailed Reports Charts/Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Costs and Volume by Category */}
            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-[#f5c518]" />
                  Investimento por Categoria
                </h3>
                <p className="text-[10px] text-[#a1a1aa] mt-0.5">Distribuição de custos e demanda por setor</p>
              </div>
              <div className="space-y-3.5">
                {['Elétrico', 'Manutenção', 'Mobiliário', 'Informático'].map(cat => {
                  const catList = ordens.filter(o => o.category === cat);
                  const count = catList.length;
                  const cost = catList.reduce((sum, o) => sum + o.cost, 0);
                  const maxCost = Math.max(...['Elétrico', 'Manutenção', 'Mobiliário', 'Informático'].map(c => 
                    ordens.filter(o => o.category === c).reduce((sum, o) => sum + o.cost, 0)
                  )) || 1;
                  const percentage = (cost / maxCost) * 100;

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-gray-300">{cat} ({count} {count === 1 ? 'OS' : 'OSs'})</span>
                        <span className="text-white font-mono">R$ {cost.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-black/45 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div 
                          className="bg-[#f5c518] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SLA Response & Priorities */}
            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-400" />
                  Demandas por Criticidade
                </h3>
                <p className="text-[10px] text-[#a1a1aa] mt-0.5">Classificação do nível de urgência dos chamados de serviço</p>
              </div>
              <div className="space-y-3.5">
                {[
                  { label: 'Crítica', value: 'critica', color: 'bg-red-500' },
                  { label: 'Alta', value: 'alta', color: 'bg-orange-500' },
                  { label: 'Média', value: 'media', color: 'bg-yellow-500' },
                  { label: 'Baixa', value: 'baixa', color: 'bg-blue-500' }
                ].map(prio => {
                  const count = ordens.filter(o => o.priority === prio.value).length;
                  const total = ordens.length || 1;
                  const percentage = (count / total) * 100;

                  return (
                    <div key={prio.value} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-gray-300">{prio.label}</span>
                        <span className="text-white font-mono">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-black/45 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div 
                          className={`${prio.color} h-full rounded-full transition-all duration-500`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* PDF/Excel mockup buttons */}
          <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Exportação e Emissão de Relatório</h3>
              <p className="text-[11px] text-gray-500">Gere um documento formatado com as estatísticas de OS e investimentos para prestação de contas.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  alert('Relatório PDF compilado e exportado com sucesso! Iniciando download no navegador...');
                }}
                className="bg-[#f5c518] hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText size={13} />
                Exportar Relatório PDF
              </button>
              <button
                onClick={() => {
                  alert('Planilha XLSX contendo 26 registros de Ordens de Serviço exportada para download!');
                }}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet size={13} className="text-emerald-500" />
                Exportar Excel (XLSX)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add OS Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#f5c518]" />
                <h2 className="font-display font-bold text-white text-base">Nova Ordem de Serviço</h2>
              </div>
              <button 
                onClick={() => {
                  stopCamera();
                  setShowAddModal(false);
                }} 
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Row: Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Título da Ordem de Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de tomada do laboratório ou Reparo de impressora"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                />
              </div>

              {/* Row: Equipment Link & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Equipamento Vinculado *</label>
                  <select
                    value={selectedEquipId}
                    onChange={(e) => handleAddEquipChange(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] transition-all"
                  >
                    {equipamentos.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.location})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Categoria da OS *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Elétrico, Informático, Mobiliário..."
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>
              </div>

              {/* Row: Location & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Local / Sala *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sala 4, Bloco B, Secretaria..."
                    value={addLocation}
                    onChange={(e) => setAddLocation(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Prioridade *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] transition-all"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica (Interrompe aula)</option>
                  </select>
                </div>
              </div>

              {/* Row: Requester & Responsible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Solicitante (Nome/Cargo)</label>
                  <input
                    type="text"
                    placeholder="Ex: Prof. Roberto - Física"
                    value={addRequester}
                    onChange={(e) => setAddRequester(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Técnico Responsável *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João - Manutenção"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>
              </div>

              {/* Row: Initial Estimated Cost */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Custo Estimado Inicial (opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={cost || ''}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>
              </div>

              {/* Row: Problem Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Descrição do Defeito / Solicitação *</label>
                <textarea
                  required
                  placeholder="Explique detalhadamente o problema ou serviço a ser realizado..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-600 transition-all custom-scrollbar"
                />
              </div>

              {/* Row: Observations */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Observações Adicionais</label>
                <textarea
                  placeholder="Qualquer outra observação pertinente (Ex: voltagem local, horário livre para acesso...)"
                  value={addObservations}
                  onChange={(e) => setAddObservations(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-600 transition-all custom-scrollbar"
                />
              </div>

              {/* Photo Upload or Capture */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  <Camera size={13} className="text-[#f5c518]" />
                  Foto do Equipamento / Defeito
                </label>

                {addPhotoUrl ? (
                  <div className="relative group bg-black/40 p-2 rounded-lg border border-white/10">
                    <img 
                      src={addPhotoUrl} 
                      className="w-full h-44 object-contain rounded-lg bg-black" 
                      alt="Equipamento com defeito" 
                    />
                    <button
                      type="button"
                      onClick={() => setAddPhotoUrl('')}
                      className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-all cursor-pointer"
                      title="Excluir Foto"
                    >
                      <Trash2 size={14} />
                    </button>
                    <span className="text-[10px] text-gray-400 text-center block mt-1">Foto adicionada ao sistema</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isCapturing ? (
                      <div className="border border-[#f5c518]/30 rounded-lg overflow-hidden bg-black flex flex-col items-center p-3 gap-3">
                        <video 
                          ref={videoRef} 
                          className="w-full h-44 object-cover bg-black rounded-md" 
                          autoPlay 
                          playsInline 
                          muted 
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <CheckCircle size={13} />
                            Capturar Foto
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <X size={13} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        
                        {/* Native/Local File Selection */}
                        <label 
                          htmlFor="add-photo-file" 
                          className="flex-1 flex flex-col items-center justify-center p-4 bg-black/30 hover:bg-black/50 border border-dashed border-white/10 hover:border-[#f5c518]/40 rounded-lg cursor-pointer transition-all gap-1.5 group"
                        >
                          <input 
                            type="file" 
                            id="add-photo-file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setAddPhotoUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Upload size={16} className="text-gray-400 group-hover:text-[#f5c518] transition-all" />
                          <div className="text-center">
                            <span className="text-[11px] text-gray-300 font-bold block">Upload de Imagem</span>
                            <span className="text-[9px] text-gray-500 block">PNG, JPG de até 5MB</span>
                          </div>
                        </label>

                        {/* Webcam Capture Activation */}
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex-1 flex flex-col items-center justify-center p-4 bg-black/30 hover:bg-black/50 border border-dashed border-white/10 hover:border-[#f5c518]/40 rounded-lg cursor-pointer transition-all gap-1.5 group"
                        >
                          <Camera size={16} className="text-[#f5c518] group-hover:scale-110 transition-all" />
                          <div className="text-center">
                            <span className="text-[11px] text-[#f5c518] font-bold block">Tirar Foto do Aparelho</span>
                            <span className="text-[9px] text-gray-500 block">Ativar câmera traseira ou frontal</span>
                          </div>
                        </button>

                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-2 border-t border-white/5 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-black bg-[#f5c518] hover:bg-amber-400 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                >
                  Abrir Ordem de Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit OS Modal */}
      {showEditModal && editingOS && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-[#f5c518]" />
                <h2 className="font-display font-bold text-white text-base">Editar Ordem: <span className="font-mono text-gray-300">{editingOS.id}</span></h2>
              </div>
              <button 
                onClick={() => {
                  stopCamera();
                  setShowEditModal(false);
                  setEditingOS(null);
                }} 
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Row: Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Título da Ordem de Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de tomada do laboratório"
                  value={editingOS.title || ''}
                  onChange={(e) => setEditingOS({ ...editingOS, title: e.target.value })}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                />
              </div>

              {/* Row: Equipment Link & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Equipamento Vinculado *</label>
                  <select
                    value={editingOS.equipId}
                    onChange={(e) => handleEditEquipChange(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] transition-all"
                  >
                    {equipamentos.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.location})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Categoria da OS *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Elétrico, Informático..."
                    value={editingOS.category || ''}
                    onChange={(e) => setEditingOS({ ...editingOS, category: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>
              </div>

              {/* Row: Location & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Local / Sala *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sala de Aula, Bloco A"
                    value={editingOS.location || ''}
                    onChange={(e) => setEditingOS({ ...editingOS, location: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Prioridade *</label>
                  <select
                    value={editingOS.priority}
                    onChange={(e) => setEditingOS({ ...editingOS, priority: e.target.value as any })}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] transition-all"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica (Interrompe aula)</option>
                  </select>
                </div>
              </div>

              {/* Row: Requester & Responsible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Solicitante (Nome/Cargo)</label>
                  <input
                    type="text"
                    placeholder="Nome do solicitante"
                    value={editingOS.requester || ''}
                    onChange={(e) => setEditingOS({ ...editingOS, requester: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Técnico Responsável *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do técnico"
                    value={editingOS.responsible}
                    onChange={(e) => setEditingOS({ ...editingOS, responsible: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] transition-all"
                  />
                </div>
              </div>

              {/* Row: Status & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Status *</label>
                  <select
                    value={editingOS.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      const closingDate = newStatus === 'concluido' ? new Date().toLocaleDateString('pt-BR') : editingOS.closingDate;
                      setEditingOS({ ...editingOS, status: newStatus, closingDate });
                    }}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] transition-all"
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Custo da Manutenção (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={editingOS.cost}
                      onChange={(e) => setEditingOS({ ...editingOS, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row: Problem Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Descrição do Defeito / Solicitação *</label>
                <textarea
                  required
                  placeholder="Descreva o problema..."
                  value={editingOS.problemDescription}
                  onChange={(e) => setEditingOS({ ...editingOS, problemDescription: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-600 transition-all custom-scrollbar"
                />
              </div>

              {/* Row: Observations */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Observações Adicionais</label>
                <textarea
                  placeholder="Ex: ferramentas especiais necessárias, etc..."
                  value={editingOS.observations || ''}
                  onChange={(e) => setEditingOS({ ...editingOS, observations: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] placeholder-gray-600 transition-all custom-scrollbar"
                />
              </div>

              {/* Photo Upload or Capture for Edit Modal */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  <Camera size={13} className="text-[#f5c518]" />
                  Foto do Equipamento / Defeito
                </label>

                {editingOS.photoUrl ? (
                  <div className="relative group bg-black/40 p-2 rounded-lg border border-white/10">
                    <img 
                      src={editingOS.photoUrl} 
                      className="w-full h-44 object-contain rounded-lg bg-black" 
                      alt="Equipamento com defeito" 
                    />
                    <button
                      type="button"
                      onClick={() => setEditingOS({ ...editingOS, photoUrl: '' })}
                      className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-all cursor-pointer"
                      title="Excluir Foto"
                    >
                      <Trash2 size={14} />
                    </button>
                    <span className="text-[10px] text-gray-400 text-center block mt-1">Foto adicionada ao sistema</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isCapturing ? (
                      <div className="border border-[#f5c518]/30 rounded-lg overflow-hidden bg-black flex flex-col items-center p-3 gap-3">
                        <video 
                          ref={videoRef} 
                          className="w-full h-44 object-cover bg-black rounded-md" 
                          autoPlay 
                          playsInline 
                          muted 
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <CheckCircle size={13} />
                            Capturar Foto
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <X size={13} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        
                        {/* Native/Local File Selection */}
                        <label 
                          htmlFor="edit-photo-file" 
                          className="flex-1 flex flex-col items-center justify-center p-4 bg-black/30 hover:bg-black/50 border border-dashed border-white/10 hover:border-[#f5c518]/40 rounded-lg cursor-pointer transition-all gap-1.5 group"
                        >
                          <input 
                            type="file" 
                            id="edit-photo-file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (editingOS) {
                                    setEditingOS({ ...editingOS, photoUrl: reader.result as string });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Upload size={16} className="text-gray-400 group-hover:text-[#f5c518] transition-all" />
                          <div className="text-center">
                            <span className="text-[11px] text-gray-300 font-bold block">Upload de Imagem</span>
                            <span className="text-[9px] text-gray-500 block">PNG, JPG de até 5MB</span>
                          </div>
                        </label>

                        {/* Webcam Capture Activation */}
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex-1 flex flex-col items-center justify-center p-4 bg-black/30 hover:bg-black/50 border border-dashed border-white/10 hover:border-[#f5c518]/40 rounded-lg cursor-pointer transition-all gap-1.5 group"
                        >
                          <Camera size={16} className="text-[#f5c518] group-hover:scale-110 transition-all" />
                          <div className="text-center">
                            <span className="text-[11px] text-[#f5c518] font-bold block">Tirar Foto do Aparelho</span>
                            <span className="text-[9px] text-gray-500 block">Ativar câmera traseira ou frontal</span>
                          </div>
                        </button>

                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-2 border-t border-white/5 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setShowEditModal(false);
                    setEditingOS(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-black bg-[#f5c518] hover:bg-amber-400 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OS Detail View Modal */}
      {showDetailModal && selectedOS && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#f5c518]" />
                <h2 className="font-display font-bold text-white text-base">Ficha da OS: <span className="text-gray-300 font-mono">{selectedOS.id}</span></h2>
              </div>
              <button onClick={() => { setShowDetailModal(false); setSelectedOS(null); }} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs custom-scrollbar">
              
              {/* Header Title of OS */}
              <div className="bg-[#f5c518]/5 p-3 rounded-lg border border-[#f5c518]/10">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Título da Solicitação</span>
                <h3 className="text-sm font-bold text-white mt-1 leading-snug">{selectedOS.title || 'Solicitação de Serviço'}</h3>
              </div>

              {/* Grid with properties */}
              <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg border border-white/5">
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">Equipamento</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedOS.equipName}</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">ID: {selectedOS.equipId}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">Categoria</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedOS.category}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">Local / Sala</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedOS.location || 'Não especificado'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">Solicitante</span>
                  <span className="font-bold text-[#f5c518] mt-0.5 block">{selectedOS.requester || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">Status</span>
                  <div className="mt-1 block">{getStatusBadge(selectedOS.status)}</div>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">Prioridade</span>
                  <span className={`mt-1 font-bold inline-block border px-2 py-0.5 rounded uppercase ${getPriorityColor(selectedOS.priority)}`}>
                    {selectedOS.priority}
                  </span>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-1">
                <span className="text-gray-500 uppercase font-bold text-[9px] block">Problema Relatado</span>
                <div className="bg-black/30 border border-white/5 p-3 rounded text-gray-200 leading-relaxed font-sans text-xs">
                  {selectedOS.problemDescription}
                </div>
              </div>

              {/* Observations */}
              {selectedOS.observations && (
                <div className="space-y-1">
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Observações Adicionais</span>
                  <div className="bg-black/30 border border-white/5 p-3 rounded text-gray-400 leading-relaxed font-sans text-xs italic">
                    {selectedOS.observations}
                  </div>
                </div>
              )}

              {/* Equip/Problem Photo */}
              {selectedOS.photoUrl && (
                <div className="space-y-1.5">
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Foto do Equipamento com Defeito</span>
                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                    <img 
                      src={selectedOS.photoUrl} 
                      className="w-full max-h-52 object-contain rounded bg-black" 
                      alt="Defeito do equipamento" 
                    />
                  </div>
                </div>
              )}

              {/* Technician, Dates and Costs */}
              <div className="grid grid-cols-3 gap-3 bg-black/10 p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-gray-500 block font-bold text-[9px] uppercase">Responsável</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedOS.responsible}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold text-[9px] uppercase">Data Abertura</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedOS.openingDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold text-[9px] uppercase">Data Conclusão</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedOS.closingDate || '---'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#f5c518]/5 p-3.5 rounded-lg border border-[#f5c518]/15">
                <span className="font-bold text-[#f5c518] uppercase text-[10px] flex items-center gap-1.5">
                  <DollarSign size={13} />
                  Custo da Ordem
                </span>
                <span className="text-sm font-bold font-mono text-white">R$ {selectedOS.cost.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-black bg-[#f5c518] hover:bg-amber-400 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer size={14} />
                Imprimir OS
              </button>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedOS(null); }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>

            {/* Hidden Print Content */}
            <div className="print-only fixed inset-0 bg-white text-black p-12 font-sans">
                <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                  <div className="flex items-center gap-4">
                    <img src="https://i.imgur.com/4XiztTt.png" alt="Logo" className="w-16 h-12 object-contain" referrerPolicy="no-referrer" />
                    <div>
                      <h1 className="text-xl font-bold uppercase tracking-tight">{schoolName}</h1>
                      <p className="text-[10px] font-bold text-gray-600 uppercase">Sistema de Gestão de Manutenção Preventiva e Corretiva</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-black text-white px-4 py-1 font-bold text-sm">ORDEM DE SERVIÇO</div>
                    <div className="text-lg font-mono font-bold mt-1">#{selectedOS.id}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-8 text-left">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Título da OS</span>
                    <p className="text-sm font-bold border-b border-gray-200 pb-1">{selectedOS.title}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Equipamento</span>
                    <p className="text-sm font-bold border-b border-gray-200 pb-1">{selectedOS.equipName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Local / Sala</span>
                    <p className="text-sm font-bold border-b border-gray-200 pb-1">{selectedOS.location || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Categoria</span>
                    <p className="text-sm font-bold border-b border-gray-200 pb-1">{selectedOS.category}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Data de Abertura</span>
                    <p className="text-sm font-bold border-b border-gray-200 pb-1">{selectedOS.openingDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Prioridade</span>
                    <p className="text-sm font-bold border-b border-gray-200 pb-1 uppercase">{selectedOS.priority}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Solicitante</span>
                    <p className="text-sm font-bold border-b border-gray-200 pb-1">{selectedOS.requester || '---'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Técnico Responsável</span>
                    <p className="text-sm font-bold border-b border-gray-200 pb-1">{selectedOS.responsible}</p>
                  </div>
                </div>

                <div className="mb-8 text-left">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Descrição do Problema / Solicitação</span>
                  <div className="border border-gray-200 p-4 bg-gray-50 min-h-[100px] text-sm leading-relaxed">
                    {selectedOS.problemDescription}
                  </div>
                </div>

                {selectedOS.observations && (
                  <div className="mb-8 text-left">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Observações Técnicas</span>
                    <div className="border border-gray-200 p-4 text-sm leading-relaxed italic">
                      {selectedOS.observations}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-12 mt-20">
                  <div className="text-center">
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase">{selectedOS.responsible}</p>
                      <p className="text-[9px] text-gray-500 uppercase">Assinatura do Técnico</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase">{selectedOS.requester || 'Solicitante'}</p>
                      <p className="text-[9px] text-gray-500 uppercase">Assinatura do Solicitante / Gestor</p>
                    </div>
                  </div>
                </div>

                <div className="fixed bottom-12 left-12 right-12 text-center text-[8px] text-gray-400 border-t border-gray-100 pt-4">
                  Documento gerado eletronicamente via Sistema de Manutenção {schoolName} em {new Date().toLocaleString('pt-BR')}.
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom OS Standard Deletion Confirmation Modal */}
      {deleteConfirmOS && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left animate-fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-white">Deletar Ordem de Serviço</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Deseja deletar a Ordem de Serviço <strong className="text-white font-mono">{deleteConfirmOS.id}</strong> (<em>{deleteConfirmOS.title}</em>)? Esta ação removerá o registro ativo do painel.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmOS(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteOS(deleteConfirmOS.id);
                  setDeleteConfirmOS(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
              >
                Deletar OS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom OS Unarchive Confirmation Modal */}
      {unarchiveConfirmOS && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left animate-fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#f5c518]">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-white">Desarquivar Ordem de Serviço</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Deseja desarquivar a OS <strong className="text-white font-mono">{unarchiveConfirmOS.id}</strong>? Ela retornará imediatamente para a lista de Ordens de Serviço Ativas.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUnarchiveConfirmOS(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onUpdateOS({ ...unarchiveConfirmOS, status: 'concluido' });
                  setUnarchiveConfirmOS(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#f5c518] hover:bg-amber-400 text-black rounded-lg transition-all cursor-pointer"
              >
                Desarquivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom OS Permanent Deletion Confirmation Modal */}
      {deletePermanentConfirmOS && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left animate-fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={24} className="animate-pulse" />
              <h3 className="font-bold text-base text-white">Exclusão Irreversível</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente a OS <strong className="text-white font-mono">{deletePermanentConfirmOS.id}</strong>? Esta ação é irreversível e o histórico financeiro e técnico da manutenção será perdido para sempre.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletePermanentConfirmOS(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteOS(deletePermanentConfirmOS.id);
                  setDeletePermanentConfirmOS(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
              >
                Sim, Deletar OS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
