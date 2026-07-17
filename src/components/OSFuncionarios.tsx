/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  FileText, 
  Printer, 
  Phone, 
  Mail, 
  UserCheck, 
  Cake, 
  Search, 
  X, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  FileSpreadsheet,
  Building,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { Funcionario, RegistroPonto, UserSession } from '../types';
import { generateTimesheetForMonth } from '../data';

interface OSFuncionariosProps {
  funcionarios: Funcionario[];
  user: UserSession;
  onAddFuncionario: (func: Omit<Funcionario, 'id'>) => void;
  onEditFuncionario: (func: Funcionario) => void;
  onDeleteFuncionario: (id: string) => void;
  logs: any[];
  onAddAuditLog: (action: string, targetType: 'funcionario' | 'ponto', targetId: string, details: string) => void;
}

export default function OSFuncionarios({
  funcionarios,
  user,
  onAddFuncionario,
  onEditFuncionario,
  onDeleteFuncionario,
  onAddAuditLog
}: OSFuncionariosProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'lista' | 'ponto'>('dashboard');
  
  // Selection/Filtering states for Folha de Ponto
  const [selectedFuncId, setSelectedFuncId] = useState<string>(funcionarios[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // Julho

  // Search in employee list
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFunc, setSelectedFunc] = useState<Funcionario | null>(null);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [printBatchMode, setPrintBatchMode] = useState(false); // individual or all
  const [deleteConfirmFunc, setDeleteConfirmFunc] = useState<Funcionario | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [role, setRole] = useState('');
  const [sector, setSector] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [entryTime, setEntryTime] = useState('08:00');
  const [exitTime, setExitTime] = useState('17:00');
  const [interval, setIntervalTime] = useState('01:00');
  const [weeklyHours, setWeeklyHours] = useState(40);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Funcionario['status']>('active');

  // Load timesheets dynamically based on employee & selected month/year
  const activeTimesheet = useMemo(() => {
    const employee = funcionarios.find(f => f.id === selectedFuncId);
    if (!employee) return [];
    return generateTimesheetForMonth(employee, selectedYear, selectedMonth);
  }, [funcionarios, selectedFuncId, selectedYear, selectedMonth]);

  // Timesheet Summary Indicators
  const timesheetSummary = useMemo(() => {
    if (activeTimesheet.length === 0) return { worked: 0, missing: 0, overtime: 0, late: 0 };
    
    let worked = 0;
    let missing = 0;
    let overtime = 0;
    let late = 0;

    activeTimesheet.forEach(p => {
      worked += p.hoursWorked;
      overtime += p.overtime;
      if (p.status === 'missing') {
        missing++;
      }
      if (p.observations && p.observations.includes('Atraso')) {
        late++;
      }
    });

    return {
      worked: parseFloat(worked.toFixed(1)),
      missing,
      overtime: parseFloat(overtime.toFixed(1)),
      late
    };
  }, [activeTimesheet]);

  // Sector list for filter
  const sectors = useMemo(() => {
    const s = new Set(funcionarios.map(f => f.sector));
    return ['Todos', ...Array.from(s)];
  }, [funcionarios]);

  // Filtered list
  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                            f.matricula.toLowerCase().includes(search.toLowerCase()) || 
                            f.role.toLowerCase().includes(search.toLowerCase());
      const matchesSector = sectorFilter === 'Todos' || f.sector === sectorFilter;
      const matchesStatus = statusFilter === 'Todos' || f.status === statusFilter;
      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [funcionarios, search, sectorFilter, statusFilter]);

  // Employee statistics for Dashboard Subtab
  const dashStats = useMemo(() => {
    const total = funcionarios.length;
    const active = funcionarios.filter(f => f.status === 'active').length;
    const vacation = funcionarios.filter(f => f.status === 'vacation').length;
    const away = funcionarios.filter(f => f.status === 'away').length;

    // Birthday of month (simulated as current date's month, say Julho)
    const birthdaysThisMonth = funcionarios.slice(0, 3); // simple display for realism

    return { total, active, vacation, away, birthdaysThisMonth };
  }, [funcionarios]);

  // Handle Add Form Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cpf.trim() || !matricula.trim() || !role.trim() || !sector.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    onAddFuncionario({
      name,
      cpf,
      matricula,
      role,
      sector,
      admissionDate: admissionDate || new Date().toLocaleDateString('pt-BR'),
      workHours: { entry: entryTime, exit: exitTime, interval },
      weeklyHours: Number(weeklyHours) || 40,
      phone,
      email,
      status
    });
    setShowAddModal(false);
  };

  // Handle Edit Form Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFunc) return;
    if (!name.trim() || !cpf.trim() || !role.trim() || !sector.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    onEditFuncionario({
      ...selectedFunc,
      name,
      cpf,
      role,
      sector,
      admissionDate,
      workHours: { entry: entryTime, exit: exitTime, interval },
      weeklyHours: Number(weeklyHours),
      phone,
      email,
      status
    });
    setShowEditModal(false);
    setSelectedFunc(null);
  };

  const openAddModal = () => {
    setName('');
    setCpf('');
    setMatricula(`CR-${202600 + funcionarios.length + 1}`);
    setRole('');
    setSector('');
    setAdmissionDate('16/07/2026');
    setEntryTime('08:00');
    setExitTime('17:00');
    setIntervalTime('01:00');
    setWeeklyHours(40);
    setPhone('');
    setEmail('');
    setStatus('active');
    setShowAddModal(true);
  };

  const openEditModal = (func: Funcionario) => {
    setSelectedFunc(func);
    setName(func.name);
    setCpf(func.cpf);
    setMatricula(func.matricula);
    setRole(func.role);
    setSector(func.sector);
    setAdmissionDate(func.admissionDate);
    setEntryTime(func.workHours.entry);
    setExitTime(func.workHours.exit);
    setIntervalTime(func.workHours.interval);
    setWeeklyHours(func.weeklyHours);
    setPhone(func.phone);
    setEmail(func.email);
    setStatus(func.status);
    setShowEditModal(true);
  };

  // Direct trigger to view/print timesheet of employee
  const handleViewTimesheet = (funcId: string) => {
    setSelectedFuncId(funcId);
    setActiveSubTab('ponto');
  };

  // Status badging
  const getStatusBadge = (status: Funcionario['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">Ativo</span>;
      case 'inactive':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/15">Inativo</span>;
      case 'vacation':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/15">Em Férias</span>;
      case 'away':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/15">Afastado</span>;
    }
  };

  // Render Batch or Individual Print Contents inside modal frame
  const renderPrintableTimesheets = () => {
    const listToPrint = printBatchMode 
      ? funcionarios.filter(f => f.status === 'active') // active batch
      : funcionarios.filter(f => f.id === selectedFuncId); // individual

    return listToPrint.map((func, idx) => {
      const timesheetData = generateTimesheetForMonth(func, selectedYear, selectedMonth);
      
      // Calculate individual stats for header in print
      let totalHours = 0;
      let totalAbsences = 0;
      let totalOvertime = 0;
      timesheetData.forEach(p => {
        totalHours += p.hoursWorked;
        totalOvertime += p.overtime;
        if (p.status === 'missing') totalAbsences++;
      });

      const monthName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][selectedMonth - 1];

      return (
        <div 
          key={func.id} 
          className="print-card bg-white text-black p-8 rounded-lg border border-gray-200 max-w-4xl mx-auto space-y-6 shadow-md text-left"
          style={{ pageBreakAfter: idx < listToPrint.length - 1 ? 'always' : 'auto' }}
        >
          {/* Institution Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold uppercase tracking-tight">Instituição</h2>
              <p className="text-xs text-gray-600 font-semibold">Endereço da Instituição</p>
              <p className="text-[10px] text-gray-500">Telefone: (00) 0000-0000 | CNPJ: 00.000.000/0000-00</p>
            </div>
            <div className="text-right space-y-1">
              <span className="bg-black text-white px-3 py-1 font-bold text-xs uppercase tracking-wider">Folha de Frequência</span>
              <p className="text-xs font-bold text-gray-700 mt-1">Período: {monthName} de {selectedYear}</p>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-800">
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[9px]">Funcionário</span>
              <span className="font-bold text-gray-900">{func.name}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[9px]">Registro / Matrícula</span>
              <span className="font-bold text-gray-900 font-mono">{func.matricula}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[9px]">Cargo</span>
              <span className="font-bold text-gray-900">{func.role}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[9px]">Setor</span>
              <span className="font-bold text-gray-900">{func.sector}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[9px]">CPF</span>
              <span className="font-bold text-gray-900 font-mono">{func.cpf}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[9px]">Escala Prevista</span>
              <span className="font-bold text-gray-900">{func.workHours.entry} às {func.workHours.exit} (Intervalo {func.workHours.interval})</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[9px]">Horas Semanais</span>
              <span className="font-bold text-gray-900">{func.weeklyHours} Horas</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold uppercase text-[9px]">Admissão</span>
              <span className="font-bold text-gray-900">{func.admissionDate}</span>
            </div>
          </div>

          {/* Timesheet Days table */}
          <table className="w-full text-[10px] border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                <th className="p-1 border border-gray-300 w-16 text-center">Data</th>
                <th className="p-1 border border-gray-300 w-24 text-left">Dia</th>
                <th className="p-1 border border-gray-300 w-16 text-center">Entrada</th>
                <th className="p-1 border border-gray-300 w-16 text-center">Saída</th>
                <th className="p-1 border border-gray-300 w-14 text-center">Intervalo</th>
                <th className="p-1 border border-gray-300 w-14 text-center">Horas Trab.</th>
                <th className="p-1 border border-gray-300 w-14 text-center">H. Extra</th>
                <th className="p-1 border border-gray-300 text-left">Observações / Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {timesheetData.map(day => (
                <tr key={day.id} className="hover:bg-gray-50">
                  <td className="p-1 border border-gray-300 text-center font-mono font-medium">{day.date.substring(0, 5)}</td>
                  <td className="p-1 border border-gray-300 text-gray-600 truncate">{day.dayOfWeek}</td>
                  <td className="p-1 border border-gray-300 text-center font-mono">{day.entryTime}</td>
                  <td className="p-1 border border-gray-300 text-center font-mono">{day.exitTime}</td>
                  <td className="p-1 border border-gray-300 text-center font-mono">{day.interval}</td>
                  <td className="p-1 border border-gray-300 text-center font-mono font-medium">{day.hoursWorked > 0 ? day.hoursWorked : ''}</td>
                  <td className="p-1 border border-gray-300 text-center font-mono text-emerald-600 font-bold">{day.overtime > 0 ? day.overtime : ''}</td>
                  <td className="p-1 border border-gray-300 text-gray-500 italic text-[9px] max-w-xs truncate">
                    {day.observations || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Sum Summary footer */}
          <div className="grid grid-cols-3 gap-4 border border-gray-300 p-3 rounded bg-gray-50 text-xs font-semibold">
            <div>Total Horas Trabalhadas: <span className="text-blue-700 text-sm font-bold font-mono">{totalHours.toFixed(1)}h</span></div>
            <div>Total Horas Extras: <span className="text-emerald-700 text-sm font-bold font-mono">{totalOvertime.toFixed(1)}h</span></div>
            <div>Faltas Registradas: <span className="text-red-700 text-sm font-bold font-mono">{totalAbsences} dia(s)</span></div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-10 pt-10 text-center text-[10px] text-gray-700">
            <div className="space-y-1">
              <div className="h-px bg-black/60 mx-6" />
              <p className="font-bold uppercase text-gray-900">{func.name}</p>
              <p className="text-gray-500">Assinatura do Funcionário</p>
            </div>
            <div className="space-y-1">
              <div className="h-px bg-black/60 mx-6" />
              <p className="font-bold uppercase text-gray-900">Recursos Humanos</p>
              <p className="text-gray-500">Instituição</p>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <span className="w-1 h-6 bg-[#f5c518] rounded-full"></span>
            Recursos Humanos e Frequência
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1 ml-3">Gerenciamento de colaboradores, escalas de trabalho e emissão de folhas de ponto mensais</p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#f5c518] hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-amber-500/10"
        >
          <UserPlus size={14} />
          Cadastrar Funcionário
        </button>
      </div>

      {/* Pill Styled Nav tabs inside Funcionarios */}
      <div className="flex pb-px no-print">
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
            onClick={() => setActiveSubTab('lista')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
              ${activeSubTab === 'lista' 
                ? 'bg-[#0a0a0a] border border-white/10 text-white shadow-sm' 
                : 'text-[#a1a1aa] hover:text-white font-medium'}`}
          >
            Funcionários
          </button>
          <button
            onClick={() => setActiveSubTab('ponto')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
              ${activeSubTab === 'ponto' 
                ? 'bg-[#0a0a0a] border border-white/10 text-white shadow-sm' 
                : 'text-[#a1a1aa] hover:text-white font-medium'}`}
          >
            Folha de Ponto
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Employee Dashboard */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 text-left no-print">
          {/* Dashboard Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total de Colaboradores</span>
                <div className="text-3xl font-black text-white">{dashStats.total}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Ativos em Serviço</span>
                <div className="text-3xl font-black text-emerald-400">{dashStats.active}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <UserCheck size={18} />
              </div>
            </div>

            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider">Colaboradores em Férias</span>
                <div className="text-3xl font-black text-yellow-400">{dashStats.vacation}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                <Calendar size={18} />
              </div>
            </div>

            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Afastados / Licença</span>
                <div className="text-3xl font-black text-orange-400">{dashStats.away}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                <UserX size={18} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Sector density list */}
            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 md:col-span-7 space-y-3">
              <h3 className="text-sm font-semibold text-white">Quadro de Distribuição por Setor</h3>
              <div className="h-px bg-white/5" />
              <div className="space-y-3 pt-1">
                {sectors.filter(s => s !== 'Todos').map(sec => {
                  const count = funcionarios.filter(f => f.sector === sec).length;
                  const percent = (count / funcionarios.length) * 100;
                  return (
                    <div key={sec} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-300 font-medium">{sec}</span>
                        <span className="text-[#f5c518] font-bold">{count} {count === 1 ? 'colaborador' : 'colaboradores'}</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-[#f5c518] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Birthday highlight card */}
            <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 md:col-span-5 flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Cake size={16} className="text-[#f5c518]" />
                  Aniversariantes do Mês (Julho)
                </h3>
                <div className="h-px bg-white/5" />
                <div className="space-y-3 pt-1">
                  {dashStats.birthdaysThisMonth.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-2 rounded bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden font-display font-bold text-xs">
                          {f.avatarUrl ? <img src={f.avatarUrl} alt={f.name} referrerPolicy="no-referrer" /> : f.name[0]}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white truncate max-w-[130px]">{f.name}</p>
                          <p className="text-[10px] text-gray-500">{f.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#f5c518] font-bold font-mono">18/07</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Employees List */}
      {activeSubTab === 'lista' && (
        <div className="space-y-4 no-print text-left">
          {/* List Toolbar / Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#18181b] p-4 rounded-xl border border-white/10">
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#f5c518]"
              />
            </div>

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#f5c518]"
            >
              <option value="Todos">Todos os Setores</option>
              {sectors.filter(s => s !== 'Todos').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#f5c518]"
            >
              <option value="Todos">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="vacation">Em Férias</option>
              <option value="away">Afastado</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          {/* Table Grid list */}
          <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden">
            {filteredFuncionarios.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Users size={32} className="mx-auto text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-300">Nenhum funcionário encontrado</h3>
                <p className="text-xs text-gray-500">Tente ajustar seus filtros de busca ou faça um novo cadastro.</p>
              </div>
            ) : (
              <>
                {/* Desktop View - High Fidelity Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/20 text-gray-400 font-medium border-b border-white/5 uppercase tracking-wider">
                        <th className="p-4 w-[110px]">Registro</th>
                        <th className="p-4">Nome completo</th>
                        <th className="p-4">Cargo / Setor</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Contato</th>
                        <th className="p-4">Escala</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {filteredFuncionarios.map(func => (
                        <tr key={func.id} className="hover:bg-white/2">
                          <td className="p-4 font-mono font-bold text-[#f5c518]">{func.matricula}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden text-xs font-bold shrink-0">
                                {func.avatarUrl ? <img src={func.avatarUrl} alt={func.name} referrerPolicy="no-referrer" /> : func.name[0]}
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs">{func.name}</div>
                                <div className="text-[10px] text-gray-500 font-mono">CPF: {func.cpf}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-white">{func.role}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Building size={10} />
                              <span>{func.sector}</span>
                            </div>
                          </td>
                          <td className="p-4">{getStatusBadge(func.status)}</td>
                          <td className="p-4 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
                              <Phone size={10} className="text-gray-500 shrink-0" />
                              <span>{func.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
                              <Mail size={10} className="text-gray-500 shrink-0" />
                              <span className="truncate max-w-[120px]" title={func.email}>{func.email}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-white text-[11px] flex items-center gap-1">
                              <Clock size={10} className="text-gray-400" />
                              <span>{func.workHours.entry} - {func.workHours.exit}</span>
                            </div>
                            <div className="text-[9px] text-gray-500">Semanal: {func.weeklyHours}h</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewTimesheet(func.id)}
                                className="px-2 py-1 text-[10px] bg-white/5 text-gray-300 hover:text-[#f5c518] hover:bg-white/10 border border-white/10 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Visualizar Folha de Ponto"
                              >
                                <FileText size={11} />
                                Ponto
                              </button>
                              <button
                                onClick={() => openEditModal(func)}
                                className="p-1.5 text-gray-400 hover:text-[#f5c518] hover:bg-white/5 rounded transition-all cursor-pointer"
                                title="Editar Perfil"
                              >
                                <Edit size={13} />
                              </button>
                              {(user.role === 'admin' || user.role === 'super_admin') && (
                                <button
                                  onClick={() => setDeleteConfirmFunc(func)}
                                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                  title="Deletar Registro"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile & Tablet View - Responsive Cards Grid */}
                <div className="block lg:hidden divide-y divide-white/5">
                  {filteredFuncionarios.map(func => (
                    <div key={func.id} className="p-4 space-y-4 hover:bg-white/2 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden text-xs font-bold shrink-0">
                            {func.avatarUrl ? <img src={func.avatarUrl} alt={func.name} referrerPolicy="no-referrer" /> : func.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">{func.name}</div>
                            <div className="text-[11px] text-gray-500 font-mono">Registro: <span className="text-[#f5c518] font-bold">{func.matricula}</span> | CPF: {func.cpf}</div>
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(func.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Cargo / Setor</span>
                          <div className="font-semibold text-white">{func.role}</div>
                          <div className="text-gray-400 text-[10px] flex items-center gap-1">
                            <Building size={10} />
                            <span>{func.sector}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Escala Horária</span>
                          <div className="font-semibold text-white flex items-center gap-1">
                            <Clock size={10} className="text-gray-400" />
                            <span>{func.workHours.entry} - {func.workHours.exit}</span>
                          </div>
                          <div className="text-gray-400 text-[10px]">Semanal: {func.weeklyHours}h (Int. {func.workHours.interval})</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
                            <Phone size={10} className="text-gray-500 shrink-0" />
                            <span>{func.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
                            <Mail size={10} className="text-gray-500 shrink-0" />
                            <span className="truncate max-w-[150px]" title={func.email}>{func.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewTimesheet(func.id)}
                            className="px-2.5 py-1.5 text-[10px] bg-[#f5c518] text-black hover:bg-amber-400 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Visualizar Folha de Ponto"
                          >
                            <FileText size={11} />
                            Ponto
                          </button>
                          <button
                            onClick={() => openEditModal(func)}
                            className="p-2 text-gray-400 hover:text-[#f5c518] hover:bg-white/5 rounded-lg border border-white/10 transition-all cursor-pointer"
                            title="Editar Perfil"
                          >
                            <Edit size={13} />
                          </button>
                          {(user.role === 'admin' || user.role === 'super_admin') && (
                            <button
                              onClick={() => setDeleteConfirmFunc(func)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-white/10 transition-all cursor-pointer"
                              title="Deletar Registro"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Folha de Ponto view */}
      {activeSubTab === 'ponto' && (
        <div className="space-y-6 no-print text-left">
          {/* Timesheet selection panels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#18181b] p-4 rounded-xl border border-white/10 items-end">
            
            {/* Employee Select */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">Selecionar Funcionário</label>
              <select
                value={selectedFuncId}
                onChange={(e) => setSelectedFuncId(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5c518]"
              >
                {funcionarios.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.role})</option>
                ))}
              </select>
            </div>

            {/* Month selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">Mês / Ano de Referência</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-[#0a0a0c] border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                >
                  <option value={1}>Janeiro</option>
                  <option value={2}>Fevereiro</option>
                  <option value={3}>Março</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Maio</option>
                  <option value={6}>Junho</option>
                  <option value={7}>Julho</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Setembro</option>
                  <option value={10}>Outubro</option>
                  <option value={11}>Novembro</option>
                  <option value={12}>Dezembro</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-[#0a0a0c] border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            {/* Print trigger buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPrintBatchMode(false); // individual
                  setShowPrintPreviewModal(true);
                }}
                className="flex-1 bg-[#f5c518] hover:bg-amber-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer size={13} />
                Imprimir Individual
              </button>
              
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <button
                  onClick={() => {
                    setPrintBatchMode(true); // batch active employees
                    setShowPrintPreviewModal(true);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Imprimir folha de ponto de todos os funcionários ativos de uma vez"
                >
                  <Printer size={13} className="text-gray-400" />
                  Em Lote
                </button>
              )}
            </div>

          </div>

          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/15 p-4 rounded-xl border border-white/5">
            <div className="text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Total Horas Trabalhadas</span>
              <span className="text-xl font-bold font-mono text-[#f5c518] mt-1 inline-block">{timesheetSummary.worked}h</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Faltas Registradas</span>
              <span className="text-xl font-bold font-mono text-red-500 mt-1 inline-block">{timesheetSummary.missing} dia(s)</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Horas Extras</span>
              <span className="text-xl font-bold font-mono text-emerald-500 mt-1 inline-block">{timesheetSummary.overtime}h</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Atrasos de Entrada</span>
              <span className="text-xl font-bold font-mono text-orange-400 mt-1 inline-block">{timesheetSummary.late} vez(es)</span>
            </div>
          </div>

          {/* Timesheet Days grid listing */}
          <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black/20 text-gray-400 font-medium border-b border-white/5 uppercase tracking-wider">
                    <th className="p-3 w-[100px] text-center">Data</th>
                    <th className="p-3">Dia da Semana</th>
                    <th className="p-3 text-center">Entrada</th>
                    <th className="p-3 text-center">Saída</th>
                    <th className="p-3 text-center">Intervalo</th>
                    <th className="p-3 text-center">Horas Trab.</th>
                    <th className="p-3 text-center">Horas Extra</th>
                    <th className="p-3">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300 font-mono">
                  {activeTimesheet.map(day => (
                    <tr key={day.id} className="hover:bg-white/2">
                      <td className="p-3 text-center font-bold text-gray-400">{day.date}</td>
                      <td className="p-3 font-sans text-gray-300 font-medium">{day.dayOfWeek}</td>
                      <td className="p-3 text-center">{day.entryTime}</td>
                      <td className="p-3 text-center">{day.exitTime}</td>
                      <td className="p-3 text-center">{day.interval}</td>
                      <td className="p-3 text-center font-bold text-white">{day.hoursWorked > 0 ? day.hoursWorked + 'h' : ''}</td>
                      <td className="p-3 text-center text-emerald-400 font-bold">{day.overtime > 0 ? day.overtime + 'h' : ''}</td>
                      <td className="p-3 font-sans text-[11px] text-gray-500 italic font-normal">
                        {day.observations || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
              <h2 className="font-display font-bold text-white text-base">Novo Funcionário</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Santos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">CPF *</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Registro (Matrícula) *</label>
                  <input
                    type="text"
                    required
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Cargo / Função *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Eletricista, Coordenador"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Setor / Departamento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Infraestrutura, TI"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Data de Admissão</label>
                  <input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              {/* Working Hours Scale */}
              <div className="p-3 bg-black/25 rounded-lg border border-white/5 space-y-3">
                <span className="text-[10px] font-bold uppercase text-[#f5c518] tracking-wider block">Escala & Horários Previstos</span>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Entrada (Entrada)</label>
                    <input
                      type="text"
                      required
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#f5c518]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Saída (Fim)</label>
                    <input
                      type="text"
                      required
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#f5c518]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Intervalo (Duração)</label>
                    <input
                      type="text"
                      required
                      value={interval}
                      onChange={(e) => setIntervalTime(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#f5c518]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Carga Horária Semanal (horas)</label>
                    <input
                      type="number"
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Status Inicial</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="active">Ativo</option>
                      <option value="vacation">Em Férias</option>
                      <option value="away">Afastado / Licença</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Telefone / Whatsapp</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">E-mail corporativo</label>
                  <input
                    type="email"
                    placeholder="email@colegioreacao.edu.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end gap-3">
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
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedFunc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
              <h2 className="font-display font-bold text-white text-base">Editar Cadastro: <span className="text-[#f5c518] font-mono">{selectedFunc.matricula}</span></h2>
              <button onClick={() => { setShowEditModal(false); setSelectedFunc(null); }} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">CPF *</label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Registro (Matrícula)</label>
                  <input
                    type="text"
                    disabled
                    value={matricula}
                    className="w-full bg-[#0a0a0c]/60 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-gray-500 cursor-not-allowed font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Cargo / Função *</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Setor / Departamento *</label>
                  <input
                    type="text"
                    required
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Data de Admissão</label>
                  <input
                    type="text"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              {/* Working Hours Scale */}
              <div className="p-3 bg-black/25 rounded-lg border border-white/5 space-y-3">
                <span className="text-[10px] font-bold uppercase text-[#f5c518] tracking-wider block">Escala & Horários Previstos</span>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Entrada</label>
                    <input
                      type="text"
                      required
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#f5c518]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Saída</label>
                    <input
                      type="text"
                      required
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#f5c518]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Intervalo</label>
                    <input
                      type="text"
                      required
                      value={interval}
                      onChange={(e) => setIntervalTime(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#f5c518]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Carga Horária Semanal</label>
                    <input
                      type="number"
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(Number(e.target.value))}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="active">Ativo</option>
                      <option value="vacation">Em Férias</option>
                      <option value="away">Afastado / Licença</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Telefone / Whatsapp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">E-mail corporativo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedFunc(null); }}
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

      {/* Printable Folha de Ponto Overlay Modal */}
      {showPrintPreviewModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto p-4 flex flex-col items-center">
          
          {/* Header controls inside print modal */}
          <div className="no-print w-full max-w-4xl bg-[#18181b] p-4 rounded-xl border border-white/10 mb-5 flex items-center justify-between shadow-2xl">
            <div className="space-y-0.5 text-left">
              <h3 className="text-sm font-semibold text-white">Visualização de Impressão Oficial</h3>
              <p className="text-[10px] text-gray-400">O documento abaixo foi gerado seguindo as normas e o cabeçalho oficial do Colégio Reação.</p>
            </div>
            
            <div className="flex gap-2.5">
              <button
                onClick={() => window.print()}
                className="bg-[#f5c518] hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer size={13} />
                Confirmar Impressão / Salvar PDF
              </button>
              
              <button
                onClick={() => setShowPrintPreviewModal(false)}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <X size={13} />
                Fechar
              </button>
            </div>
          </div>

          {/* Printable container */}
          <div className="w-full space-y-6">
            {renderPrintableTimesheets()}
          </div>

          {/* Bottom spacer for print modal */}
          <div className="no-print h-12" />
        </div>
      )}

      {/* Custom Deletion Confirmation Modal */}
      {deleteConfirmFunc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-white">Confirmar Exclusão</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja excluir definitivamente o funcionário <strong className="text-white">{deleteConfirmFunc.name}</strong>? Esta ação removerá permanentemente seu registro do sistema.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmFunc(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteFuncionario(deleteConfirmFunc.id);
                  setDeleteConfirmFunc(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer animate-pulse"
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
