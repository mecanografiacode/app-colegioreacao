/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  Check, 
  Settings, 
  X,
  FileText,
  Menu,
  Cloud,
  RefreshCw
} from 'lucide-react';

import { 
  UserSession, 
  User,
  OrdemServico, 
  Equipamento, 
  ChamadoSuporte, 
  LogAuditoria, 
  Funcionario,
  Emprestimo 
} from './types';

import { 
  initializeDB, 
  getLocalStorageData, 
  setLocalStorageData 
} from './data';

import OfflineQueueService from './services/OfflineQueueService';
import IndexedDBService from './services/IndexedDBService';

import Sidebar from './components/Sidebar';
import OSDashboard from './components/OSDashboard';
import OSOrdensView from './components/OSOrdensView';
import OSEquipamentos from './components/OSEquipamentos';
import OSSuporte from './components/OSSuporte';
import OSAuditoria from './components/OSAuditoria';
import OSConfiguracoes from './components/OSConfiguracoes';
import OSFuncionarios from './components/OSFuncionarios';
import UserManagement from './components/UserManagement';
import Login from './components/Login';

export default function App() {
  // Theme & Collapse
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [collapsed, setCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(OfflineQueueService.getOnlineStatus());
  const [isSyncing, setIsSyncing] = useState(OfflineQueueService.getSyncingStatus());

  // School Custom Branding
  const [schoolName, setSchoolName] = useState(() => {
    return localStorage.getItem('colegio_reacao_school_name') || 'Colégio Reação';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setSchoolName(localStorage.getItem('colegio_reacao_school_name') || 'Colégio Reação');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Active Layout Swappers
  const [activeSection, setActiveSection] = useState<string>('os'); // os, equipamentos, suporte, auditoria, configuracoes, funcionarios, usuarios
  const [activeSubTab, setActiveSubTab] = useState<string>('dashboard'); // dashboard, ordens, relatorios, arquivo
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserSession | null>(null);

  // DB States
  const [users, setUsers] = useState<User[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [chamados, setChamados] = useState<ChamadoSuporte[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [logsFuncionarios, setLogsFuncionarios] = useState<LogAuditoria[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);

  // Notifications drawer state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Initialize DB on Mount and Subscribe to Online state
  useEffect(() => {
    // Forçar limpeza de dados antigos para entregar o sistema "zerado"
    const hasBeenReset = localStorage.getItem('system_reset_v2');
    if (!hasBeenReset) {
      localStorage.clear();
      localStorage.setItem('system_reset_v2', 'true');
      window.location.reload();
      return;
    }

    initializeDB();
    
    // Subscribe to online status changes
    const unsubscribeOnline = OfflineQueueService.subscribe((online, syncing) => {
      setIsOnline(online);
      setIsSyncing(syncing);
    });

    // Load states synchronously from localStorage for instant display
    const cachedUsers = getLocalStorageData<User[]>('users', []);
    const cachedOrdens = getLocalStorageData<OrdemServico[]>('ordens', []);
    const cachedEquipamentos = getLocalStorageData<Equipamento[]>('equipamentos', []);
    const cachedChamados = getLocalStorageData<ChamadoSuporte[]>('suporte', []);
    const cachedFuncionarios = getLocalStorageData<Funcionario[]>('funcionarios', []);
    const cachedLogs = getLocalStorageData<LogAuditoria[]>('auditoria', []);
    const cachedLogsFuncionarios = getLocalStorageData<LogAuditoria[]>('auditoria_funcionarios', []);
    const cachedEmprestimos = getLocalStorageData<Emprestimo[]>('emprestimos', []);

    setUsers(cachedUsers);
    setOrdens(cachedOrdens);
    setEquipamentos(cachedEquipamentos);
    setChamados(cachedChamados);
    setFuncionarios(cachedFuncionarios);
    setLogs(cachedLogs);
    setLogsFuncionarios(cachedLogsFuncionarios);
    setEmprestimos(cachedEmprestimos);

    // Asynchronously verify against IndexedDB or Firestore to recover/sync
    const syncDataWithRemote = async () => {
      const dbPrefix = 'colegio_reacao_';
      try {
        const isFirebaseActive = FirebaseService.isConfigured();

        async function syncCollection<T>(key: string, currentLocal: T[], setter: (data: T[]) => void) {
          // If Firebase is active, prioritize remote data
          if (isFirebaseActive) {
            try {
              const remoteData = await (FirebaseService as any)[key].list();
              if (remoteData && remoteData.length > 0) {
                setter(remoteData);
                localStorage.setItem(dbPrefix + key, JSON.stringify(remoteData));
                console.log(`[Remote Sync] Loaded ${key} from Firestore successfully.`);
                return;
              }
            } catch (err) {
              console.warn(`[Remote Sync] Failed to load ${key} from Firestore:`, err);
            }
          }

          // Fallback to IndexedDB recovery if local is empty
          if (currentLocal.length === 0) {
            const dbData = await IndexedDBService.getItem<T[]>(dbPrefix + key);
            if (dbData && dbData.length > 0) {
              setter(dbData);
              localStorage.setItem(dbPrefix + key, JSON.stringify(dbData));
              console.log(`[Offline Resilience] Restored ${key} from IndexedDB successfully.`);
            }
          }
        }

        await syncCollection('users', cachedUsers, setUsers);
        await syncCollection('ordens', cachedOrdens, setOrdens);
        await syncCollection('equipamentos', cachedEquipamentos, setEquipamentos);
        await syncCollection('suporte', cachedChamados, setChamados);
        await syncCollection('funcionarios', cachedFuncionarios, setFuncionarios);
        await syncCollection('auditoria', cachedLogs, setLogs);
        await syncCollection('auditoria_funcionarios', cachedLogsFuncionarios, setLogsFuncionarios);
        await syncCollection('emprestimos', cachedEmprestimos, setEmprestimos);
      } catch (e) {
        console.warn('[Data Sync] Error during remote/local synchronization:', e);
      }
    };

    syncDataWithRemote();

    // Restore Session
    const savedSession = localStorage.getItem('active_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUser(session);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('active_session');
      }
    }

    return () => {
      unsubscribeOnline();
    };
  }, []);

  // Sync helpers
  const saveAndSetUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    setLocalStorageData('users', newUsers);
  };
  const saveAndSetOrdens = (newOrdens: OrdemServico[]) => {
    setOrdens(newOrdens);
    setLocalStorageData('ordens', newOrdens);
  };

  const saveAndSetEquipamentos = (newEquips: Equipamento[]) => {
    setEquipamentos(newEquips);
    setLocalStorageData('equipamentos', newEquips);
  };

  const saveAndSetChamados = (newChamados: ChamadoSuporte[]) => {
    setChamados(newChamados);
    setLocalStorageData('suporte', newChamados);
  };

  const saveAndSetFuncionarios = (newFuncs: Funcionario[]) => {
    setFuncionarios(newFuncs);
    setLocalStorageData('funcionarios', newFuncs);
  };

  const saveAndSetLogs = (newLogs: LogAuditoria[]) => {
    setLogs(newLogs);
    setLocalStorageData('auditoria', newLogs);
  };

  const saveAndSetLogsFuncionarios = (newLogs: LogAuditoria[]) => {
    setLogsFuncionarios(newLogs);
    setLocalStorageData('auditoria_funcionarios', newLogs);
  };

  const saveAndSetEmprestimos = (newLoans: Emprestimo[]) => {
    setEmprestimos(newLoans);
    setLocalStorageData('emprestimos', newLoans);
  };

  const isGuest = user?.role === 'guest';

  // Sample data for guests to visualize functionality without seeing real data
  const MOCK_ORDENS: OrdemServico[] = [
    {
      id: 'OS-EX-001',
      equipId: 'EQ-EX-001',
      equipName: 'Computador Administrativo',
      category: 'TI',
      problemDescription: 'Lentidão extrema ao abrir planilhas.',
      status: 'aberto',
      priority: 'media',
      responsible: 'Técnico Visitante',
      openingDate: new Date().toLocaleDateString('pt-BR'),
      cost: 0,
      location: 'Secretaria',
      requester: 'Ana Visitante',
      history: [{ date: new Date().toLocaleDateString('pt-BR'), action: 'Ordem de serviço criada (Exemplo)', user: 'Sistema' }]
    }
  ];

  const MOCK_EQUIPAMENTOS: Equipamento[] = [
    {
      id: 'EQ-EX-001',
      name: 'Computador Administrativo',
      category: 'TI',
      location: 'Secretaria',
      status: 'operacional',
      acquisitionDate: '01/01/2024'
    }
  ];

  const MOCK_FUNCIONARIOS: Funcionario[] = [
    {
      id: 'F-EX-001',
      name: 'Funcionário de Demonstração',
      cpf: '000.000.000-00',
      matricula: '12345',
      role: 'Professor',
      sector: 'Ensino Médio',
      admissionDate: '01/01/2020',
      workHours: { entry: '07:30', exit: '12:00', interval: '00:00' },
      weeklyHours: 20,
      phone: '(61) 99999-9999',
      email: 'exemplo@sistema.com',
      status: 'active'
    }
  ];

  // Display data based on guest status
  const displayOrdens = useMemo(() => isGuest ? MOCK_ORDENS : ordens, [isGuest, ordens]);
  const displayEquipamentos = useMemo(() => isGuest ? MOCK_EQUIPAMENTOS : equipamentos, [isGuest, equipamentos]);
  const displayChamados = useMemo(() => isGuest ? [] : chamados, [isGuest, chamados]);
  const displayFuncionarios = useMemo(() => isGuest ? MOCK_FUNCIONARIOS : funcionarios, [isGuest, funcionarios]);
  const displayLogs = useMemo(() => isGuest ? [] : logs, [isGuest, logs]);
  const displayLogsFuncionarios = useMemo(() => isGuest ? [] : logsFuncionarios, [isGuest, logsFuncionarios]);
  const displayEmprestimos = useMemo(() => isGuest ? [] : emprestimos, [isGuest, emprestimos]);
  const displayUsers = useMemo(() => isGuest ? [] : users, [isGuest, users]);

  // Push new event into Audit Log
  const handleAddAuditLog = (action: string, targetType: LogAuditoria['targetType'], targetId: string, details: string) => {
    if (isGuest) return;
    const newLog: LogAuditoria = {
      id: `LOG-${Date.now()}`,
      userId: user?.email || 'sistema',
      userName: user?.name || 'Sistema',
      action,
      timestamp: new Date().toLocaleString('pt-BR'),
      targetType,
      targetId,
      details
    };

    const staffEmails = ['arthurrfgomes@gmail.com', 'colinaadm201@gmail.com'].map(e => e.toLowerCase());
    const isStaffUser = user && staffEmails.includes(user.email.toLowerCase());
    const isStaffTarget = targetType === 'funcionario' || targetType === 'ponto';

    if (isStaffUser && isStaffTarget) {
      setLogsFuncionarios(prev => {
        const updated = [newLog, ...prev];
        setLocalStorageData('auditoria_funcionarios', updated);
        return updated;
      });
      return;
    }

    setLogs(prev => {
      const updated = [newLog, ...prev];
      setLocalStorageData('auditoria', updated);
      return updated;
    });
  };

  const handleUpdateUser = (updatedSession: UserSession) => {
    if (isGuest) return;
    
    // Create a copy without the password for the active session
    const { password, ...sessionWithoutPassword } = updatedSession;
    
    setUser(sessionWithoutPassword);
    localStorage.setItem('active_session', JSON.stringify(sessionWithoutPassword));
    
    // Also update the user in the main users list if it exists
    setUsers(prev => {
      const updatedUsers = prev.map(u => {
        if (u.email === updatedSession.email) {
          const updatedUser = { ...u, name: updatedSession.name };
          if (password) {
            updatedUser.password = password;
          }
          return updatedUser;
        }
        return u;
      });
      setLocalStorageData('users', updatedUsers);
      const mainUser = updatedUsers.find(u => u.email === updatedSession.email);
      if (mainUser) {
        OfflineQueueService.enqueue('UPDATE', 'users', mainUser.id, mainUser);
      }
      return updatedUsers;
    });
    
    handleAddAuditLog('Atualização de Perfil', 'sistema', updatedSession.email, `Usuário ${updatedSession.name} atualizou seu perfil${password ? ' e senha' : ''}.`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('active_session');
  };

  const handleLogin = (session: UserSession) => {
    setUser(session);
    setIsAuthenticated(true);
    localStorage.setItem('active_session', JSON.stringify(session));
  };

  const handleAddUser = (userData: Omit<User, 'id'>) => {
    if (isGuest) return;
    const newUser: User = {
      ...userData,
      id: `U-${Date.now().toString().slice(-6)}`
    };
    const updated = [...users, newUser];
    saveAndSetUsers(updated);
    OfflineQueueService.enqueue('CREATE', 'users', newUser.id, newUser);
    handleAddAuditLog('Novo Usuário', 'sistema', newUser.id, `Usuário ${newUser.name} criado por ${user?.name}`);
  };

  const handleDeleteUser = (id: string) => {
    if (isGuest) return;
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete) {
      const updated = users.filter(u => u.id !== id);
      saveAndSetUsers(updated);
      OfflineQueueService.enqueue('DELETE', 'users', id, null);
      handleAddAuditLog('Remoção de Usuário', 'sistema', id, `Usuário ${userToDelete.name} removido por ${user?.name}`);
    }
  };

  // Mutator actions: ORDENS DE SERVIÇO
  const handleAddOS = (os: Omit<OrdemServico, 'id'>) => {
    if (isGuest) return;
    let nextId = '';
    setOrdens(prev => {
      nextId = prev.length > 0 
        ? `OS-0${Math.max(...prev.map(o => parseInt(o.id.split('-')[1]) || 0)) + 1}`
        : 'OS-001';

      const newOS: OrdemServico = {
        id: nextId,
        ...os,
        history: [{
          date: new Date().toLocaleDateString('pt-BR'),
          action: 'Ordem de serviço criada',
          user: user!.name
        }]
      };

      const updated = [newOS, ...prev];
      setLocalStorageData('ordens', updated);
      OfflineQueueService.enqueue('CREATE', 'ordens', nextId, newOS);
      
      // Push notification dynamically
      setNotifications(n => [
        { id: Date.now(), text: `Nova OS ${nextId} criada para ${os.equipName}.`, time: 'Agora mesmo', read: false },
        ...n
      ]);
      return updated;
    });
    // We use a timeout or useEffect for dependencies but for simple app calling it here is safer than inside updater
    if (nextId) handleAddAuditLog('Criação de OS', 'os', nextId, `Criou Ordem de Serviço para o equipamento: ${os.equipName}`);
  };

  const handleUpdateOS = (os: OrdemServico) => {
    setOrdens(prev => {
      const updated = prev.map(o => o.id === os.id ? os : o);
      setLocalStorageData('ordens', updated);
      OfflineQueueService.enqueue('UPDATE', 'ordens', os.id, os);
      return updated;
    });
    handleAddAuditLog('Atualização de OS', 'os', os.id, `Status alterado para: ${os.status}`);
  };

  const handleDeleteOS = (id: string) => {
    if (isGuest) return;
    setOrdens(prev => {
      const updated = prev.filter(o => o.id !== id);
      setLocalStorageData('ordens', updated);
      OfflineQueueService.enqueue('DELETE', 'ordens', id, null);
      return updated;
    });
    handleAddAuditLog('Exclusão de OS', 'os', id, `Ordem de serviço deletada.`);
  };

  // Mutator actions: EQUIPAMENTOS
  const handleAddEquipamento = (equip: Omit<Equipamento, 'id'>) => {
    if (isGuest) return;
    const nextId = `EQ-${Date.now().toString().slice(-6)}`;
    setEquipamentos(prev => {
      const newEquip: Equipamento = {
        id: nextId,
        ...equip
      };
      const updated = [...prev, newEquip];
      setLocalStorageData('equipamentos', updated);
      OfflineQueueService.enqueue('CREATE', 'equipamentos', nextId, newEquip);
      return updated;
    });
    handleAddAuditLog('Cadastro de Equipamento', 'equipamento', nextId, `Cadastrou the equipamento: ${equip.name}`);
  };

  const handleEditEquipamento = (equip: Equipamento) => {
    if (isGuest) return;
    setEquipamentos(prev => {
      const updated = prev.map(e => e.id === equip.id ? equip : e);
      setLocalStorageData('equipamentos', updated);
      OfflineQueueService.enqueue('UPDATE', 'equipamentos', equip.id, equip);
      return updated;
    });
    handleAddAuditLog('Edição de Equipamento', 'equipamento', equip.id, `Alterou dados cadastrais de ${equip.name}`);
  };

  const handleDeleteEquipamento = (id: string) => {
    if (isGuest) return;
    setEquipamentos(prev => {
      const updated = prev.filter(e => e.id !== id);
      setLocalStorageData('equipamentos', updated);
      OfflineQueueService.enqueue('DELETE', 'equipamentos', id, null);
      return updated;
    });
    handleAddAuditLog('Exclusão de Equipamento', 'equipamento', id, `Equipamento removido do sistema.`);
  };

  // Mutator actions: EMPRÉSTIMOS
  const handleAddEmprestimo = (loan: Omit<Emprestimo, 'id'>) => {
    if (isGuest) return;
    const nextId = `EMP-${Date.now().toString().slice(-6)}`;
    setEmprestimos(prev => {
      const newLoan: Emprestimo = {
        id: nextId,
        ...loan
      };
      const updated = [newLoan, ...prev];
      setLocalStorageData('emprestimos', updated);
      OfflineQueueService.enqueue('CREATE', 'emprestimos', nextId, newLoan);
      return updated;
    });
    handleAddAuditLog('Registro de Empréstimo', 'equipamento', loan.equipId, `Empréstimo de ${loan.equipName} para ${loan.responsibleName}`);
  };

  const handleReturnEmprestimo = (id: string, returnObs: string, returnSignature: string) => {
    if (isGuest) return;
    let loanEquipId = '';
    let loanEquipName = '';
    setEmprestimos(prev => {
      let returnedLoan: any = null;
      const updated = prev.map(emp => {
        if (emp.id === id) {
          loanEquipId = emp.equipId;
          loanEquipName = emp.equipName;
          returnedLoan = { 
            ...emp, 
            status: 'devolvido' as const, 
            returnDate: new Date().toLocaleString('pt-BR'),
            returnObservations: returnObs,
            returnSignatureUrl: returnSignature
          };
          return returnedLoan;
        }
        return emp;
      });
      setLocalStorageData('emprestimos', updated);
      if (returnedLoan) {
        OfflineQueueService.enqueue('UPDATE', 'emprestimos', id, returnedLoan);
      }
      return updated;
    });
    if (loanEquipId) {
      handleAddAuditLog('Devolução de Equipamento', 'equipamento', loanEquipId, `Devolução de ${loanEquipName} confirmada com observações.`);
    }
  };

  const handleDeleteEmprestimo = (id: string) => {
    if (isGuest) return;
    const loanToDelete = emprestimos.find(e => e.id === id);
    if (loanToDelete) {
      setEmprestimos(prev => {
        const updated = prev.filter(e => e.id !== id);
        setLocalStorageData('emprestimos', updated);
        OfflineQueueService.enqueue('DELETE', 'emprestimos', id, null);
        return updated;
      });
      handleAddAuditLog('Exclusão de Registro de Empréstimo', 'equipamento', loanToDelete.equipId, `Registro de empréstimo de ${loanToDelete.equipName} para ${loanToDelete.responsibleName} removido.`);
    }
  };

  // Mutator actions: SUPORTE TÉCNICO
  const handleAddChamado = (chamado: Omit<ChamadoSuporte, 'id'>) => {
    if (isGuest) return;
    const nextId = `SUP-${Date.now().toString().slice(-6)}`;
    setChamados(prev => {
      const newChamado: ChamadoSuporte = {
        id: nextId,
        ...chamado
      };
      const updated = [newChamado, ...prev];
      setLocalStorageData('suporte', updated);
      OfflineQueueService.enqueue('CREATE', 'suporte', nextId, newChamado);
      return updated;
    });
    handleAddAuditLog('Abertura de Chamado', 'suporte', nextId, `Abriu chamado de suporte TI: ${chamado.title}`);
  };

  const handleUpdateChamado = (chamado: ChamadoSuporte) => {
    if (isGuest) return;
    setChamados(prev => {
      const updated = prev.map(c => c.id === chamado.id ? chamado : c);
      setLocalStorageData('suporte', updated);
      OfflineQueueService.enqueue('UPDATE', 'suporte', chamado.id, chamado);
      return updated;
    });
    handleAddAuditLog('Atualização de Chamado', 'suporte', chamado.id, `Chamado de suporte alterado para status ${chamado.status}`);
  };

  const handleDeleteChamado = (id: string) => {
    if (isGuest) return;
    const ticketToDelete = chamados.find(c => c.id === id);
    if (ticketToDelete) {
      setChamados(prev => {
        const updated = prev.filter(c => c.id !== id);
        setLocalStorageData('suporte', updated);
        OfflineQueueService.enqueue('DELETE', 'suporte', id, null);
        return updated;
      });
      handleAddAuditLog('Exclusão de Chamado', 'suporte', id, `Chamado "${ticketToDelete.title}" removido do sistema.`);
    }
  };

  // Mutator actions: FUNCIONÁRIOS
  const handleAddFuncionario = (func: Omit<Funcionario, 'id'>) => {
    if (isGuest) return;
    const nextId = `F-${Date.now().toString().slice(-6)}`;
    setFuncionarios(prev => {
      const newFunc: Funcionario = {
        id: nextId,
        ...func
      };
      const updated = [...prev, newFunc];
      setLocalStorageData('funcionarios', updated);
      OfflineQueueService.enqueue('CREATE', 'funcionarios', nextId, newFunc);
      return updated;
    });
    handleAddAuditLog('Cadastro de Funcionário', 'funcionario', nextId, `Cadastrou o funcionário: ${func.name}`);
  };

  const handleEditFuncionario = (func: Funcionario) => {
    if (isGuest) return;
    setFuncionarios(prev => {
      const updated = prev.map(f => f.id === func.id ? func : f);
      setLocalStorageData('funcionarios', updated);
      OfflineQueueService.enqueue('UPDATE', 'funcionarios', func.id, func);
      return updated;
    });
    handleAddAuditLog('Edição de Funcionário', 'funcionario', func.id, `Atualizou dados do funcionário: ${func.name}`);
  };

  const handleDeleteFuncionario = (id: string) => {
    if (isGuest) return;
    const funcionarioToDelete = funcionarios.find(f => f.id === id);
    if (funcionarioToDelete) {
      setFuncionarios(prev => {
        const updated = prev.filter(f => f.id !== id);
        setLocalStorageData('funcionarios', updated);
        OfflineQueueService.enqueue('DELETE', 'funcionarios', id, null);
        return updated;
      });
      handleAddAuditLog('Exclusão de Funcionário', 'funcionario', funcionarioToDelete.matricula, `Removido do quadro de funcionários.`);
    }
  };

  // Unread notification badge count
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Section details
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'os': return 'Ordens de Serviço';
      case 'equipamentos': return 'Equipamentos';
      case 'suporte': return 'Suporte Técnico';
      case 'auditoria': return 'Auditoria';
      case 'funcionarios': return 'Funcionários';
      case 'usuarios': return 'Gestão de Usuários';
      case 'configuracoes': return 'Configurações';
      default: return 'Ordens de Serviço';
    }
  };

  const getSectionSubtitle = () => {
    switch (activeSection) {
      case 'os': return 'Gerencie ordens, relatórios e arquivos';
      case 'equipamentos': return 'Gerencie inventário, localização e status de ativos';
      case 'suporte': return 'Gerencie chamados e chamados de suporte técnico de TI';
      case 'auditoria': return 'Visualize o histórico de alterações gerais de segurança';
      case 'funcionarios': return 'Gerencie escalas de ponto, contratações e dados cadastrais';
      case 'usuarios': return 'Controle de acessos, níveis de permissão e novos usuários';
      case 'configuracoes': return 'Ajuste os parâmetros globais da instituição escolar';
      default: return '';
    }
  };

  if (!isAuthenticated || !user) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  return (
    <div className="min-h-screen font-sans flex flex-col md:flex-row bg-[#0a0a0a] text-white"
    >
      {/* Mobile Top Header (only visible on mobile/tablet) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#111113] border-b border-white/10 no-print">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <img 
            src="https://i.imgur.com/4XiztTt.png" 
            alt="Logo" 
            className="w-12 h-8 object-contain shrink-0" 
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-xs tracking-tight">{schoolName}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Connection Status Dot */}
          <span 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} 
            title={isOnline ? 'Sistema Conectado (Online)' : 'Trabalhando em Modo Offline'}
          />
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-400 hover:text-white rounded-lg relative cursor-pointer"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-600 rounded-full text-[8px] font-bold text-white flex items-center justify-center shadow">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop for Sidebar Drawer */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={(sec) => {
          setActiveSection(sec);
          // Auto-default subtabs
          if (sec === 'os') setActiveSubTab('dashboard');
        }}
        user={user}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Container */}
      <main className={`flex-1 min-h-screen transition-all duration-300 flex flex-col justify-between
        ${collapsed ? 'md:pl-20' : 'md:pl-64'} pl-0`}
      >
        
        {/* Main Content scroll block */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          
          {/* Header row */}
          <header className="flex items-center justify-between no-print">
            <div className="text-left">
              <h1 className="text-2xl font-black font-display tracking-tight leading-tight">
                {getSectionTitle()}
              </h1>
              <p className="text-xs text-[#a1a1aa] mt-1">
                {getSectionSubtitle()}
              </p>
            </div>

            {/* Header Right Widgets */}
            <div className="flex items-center gap-4 relative shrink-0">
              
              {/* Sync Status Indicator */}
              {isSyncing && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-pulse">
                  <div className="relative">
                    <Cloud size={14} className="text-blue-400" />
                    <RefreshCw size={8} className="absolute -bottom-0.5 -right-0.5 text-blue-300 animate-spin" />
                  </div>
                  <span className="hidden lg:inline">Sincronizando...</span>
                </div>
              )}

              {/* Connection Status Indicator */}
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
                  isOnline 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
                title={isOnline ? 'Todos os sistemas conectados' : 'Você está desconectado. Todas as alterações serão salvas localmente.'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="hidden sm:inline">{isOnline ? '🟢 Online' : '🔴 Offline'}</span>
              </div>

              {/* Notification Center */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[#18181b] border border-white/10 text-[#a1a1aa] hover:text-white transition-all cursor-pointer relative"
                title="Notificações"
              >
                <Bell size={16} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Theme Indicator (Moon) */}
              <button
                onClick={() => {
                  alert(`O tema "Sophisticated Dark" está ativo para excelente ergonomia visual no ${schoolName}.`);
                }}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#f5c518] hover:scale-105 transition-all cursor-pointer"
                title="Modo Escuro Ativo"
              >
                <Moon size={16} fill="currentColor" />
              </button>

              {/* Notification Drawer Popover */}
              {showNotifications && (
                <div className="absolute right-0 top-11 w-80 rounded-xl border p-4 space-y-3 z-50 text-left shadow-2xl bg-[#18181b] border-white/10 text-white shadow-black/50"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="font-bold text-xs font-display">Notificações Recentes</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[10px] text-[#f5c518] hover:underline cursor-pointer"
                      >
                        Marcar todas como lidas
                      </button>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white">
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto divide-y divide-white/5 pr-1">
                    {notifications.map(notif => (
                      <div key={notif.id} className="pt-2 flex flex-col gap-1 text-[11px] first:pt-0">
                        <div className="flex items-start gap-1.5 justify-between">
                          <p className={`leading-relaxed ${notif.read ? 'text-gray-400' : 'text-white font-semibold'}`}>
                            {notif.text}
                          </p>
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-[#f5c518] shrink-0 mt-1" />}
                        </div>
                        <span className="text-[9px] text-gray-500 font-medium">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </header>

          <div className="h-px bg-white/10 no-print" />

          {/* DYNAMIC SECTION ROUTING PANEL */}
          <div className="space-y-6">
            
            {/* Section: Ordens de Serviço */}
            {activeSection === 'os' && (
              <div className="space-y-6">
                <OSOrdensView 
                  ordens={displayOrdens} 
                  equipamentos={displayEquipamentos}
                  onAddOS={handleAddOS}
                  onUpdateOS={handleUpdateOS}
                  onDeleteOS={handleDeleteOS}
                  activeSubTab={activeSubTab}
                  setActiveSubTab={setActiveSubTab}
                  userRole={user.role}
                  schoolName={schoolName}
                />
              </div>
            )}

            {/* Section: Equipamentos */}
            {activeSection === 'equipamentos' && (
              <OSEquipamentos 
                equipamentos={displayEquipamentos}
                ordens={displayOrdens}
                emprestimos={displayEmprestimos}
                user={user}
                onAddEquipamento={handleAddEquipamento}
                onEditEquipamento={handleEditEquipamento}
                onDeleteEquipamento={handleDeleteEquipamento}
                onAddEmprestimo={handleAddEmprestimo}
                onReturnEmprestimo={handleReturnEmprestimo}
                onDeleteEmprestimo={handleDeleteEmprestimo}
              />
            )}

            {/* Section: Suporte Técnico */}
            {activeSection === 'suporte' && (
              <OSSuporte 
                chamados={displayChamados}
                user={user}
                onAddChamado={handleAddChamado}
                onUpdateChamado={handleUpdateChamado}
                onDeleteChamado={handleDeleteChamado}
                currentUserEmail={user.email}
              />
            )}

            {/* Section: Auditoria */}
            {activeSection === 'auditoria' && (
              user.role === 'admin' || user.role === 'super_admin' || user.role === 'guest' ? (
                <OSAuditoria 
                  logs={displayLogs} 
                  logsFuncionarios={displayLogsFuncionarios}
                  user={user}
                />
              ) : (
                <div className="bg-[#18181b] p-12 text-center rounded-xl border border-white/10 space-y-3">
                  <AlertTriangle size={40} className="mx-auto text-orange-400" />
                  <h2 className="text-base font-bold text-white">Acesso Negado</h2>
                  <p className="text-xs text-gray-400">Você não tem permissão de Administrador para visualizar os Logs de Auditoria do {schoolName}.</p>
                  <button 
                    onClick={() => setActiveSection('os')}
                    className="bg-[#f5c518] text-black font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Voltar ao Início
                  </button>
                </div>
              )
            )}

            {/* Section: Usuários (Gestão de Acessos) */}
            {activeSection === 'usuarios' && (
              user.role === 'super_admin' || user.role === 'guest' ? (
                <UserManagement 
                  users={displayUsers}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                  currentUserEmail={user.email}
                />
              ) : (
                <div className="bg-[#18181b] p-12 text-center rounded-xl border border-white/10 space-y-3">
                  <AlertTriangle size={40} className="mx-auto text-orange-400" />
                  <h2 className="text-base font-bold text-white">Acesso Restrito</h2>
                  <p className="text-xs text-gray-400">Somente o Super Admin tem acesso à gestão de usuários e permissões do sistema.</p>
                </div>
              )
            )}

            {/* Section: Funcionários */}
            {activeSection === 'funcionarios' && (
              (isGuest || ['colinaadm201@gmail.com', 'arthurrfgomes@gmail.com'].some(e => e.toLowerCase() === user.email.toLowerCase())) ? (
                <OSFuncionarios 
                  funcionarios={displayFuncionarios}
                  user={user}
                  onAddFuncionario={handleAddFuncionario}
                  onEditFuncionario={handleEditFuncionario}
                  onDeleteFuncionario={handleDeleteFuncionario}
                  logs={displayLogs}
                  onAddAuditLog={handleAddAuditLog}
                />
              ) : (
                <div className="bg-[#18181b] p-12 text-center rounded-xl border border-white/10 space-y-3">
                  <AlertTriangle size={40} className="mx-auto text-orange-400" />
                  <h2 className="text-base font-bold text-white">Acesso Restrito</h2>
                  <p className="text-xs text-gray-400">Esta seção é restrita aos gestores autorizados Marianna e Arthur no {schoolName}.</p>
                  <button 
                    onClick={() => setActiveSection('os')}
                    className="bg-[#f5c518] text-black font-bold text-xs px-4 py-2 rounded-lg cursor-pointer mt-4"
                  >
                    Voltar ao Início
                  </button>
                </div>
              )
            )}

            {/* Section: Configurações */}
            {activeSection === 'configuracoes' && (
              <OSConfiguracoes 
                user={user} 
                onUpdateUser={handleUpdateUser} 
              />
            )}

          </div>

        </div>

        {/* Footer info (no-print) */}
        <footer className="py-4 px-8 border-t text-center text-[10px] text-[#a1a1aa] font-medium no-print bg-[#09090b] border-white/5"
        >
          <span>{schoolName} © 2026 — Gestor de Atividades e Frequência Administrativa</span>
        </footer>

      </main>
    </div>
  );
}
