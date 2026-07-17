import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Shield, 
  Calendar, 
  Trash2, 
  X,
  Check,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { User } from '../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  currentUserEmail: string;
}

export default function UserManagement({ users, onAddUser, onDeleteUser, currentUserEmail }: UserManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'operator'>('operator');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      name,
      email,
      password,
      role,
      createdAt: new Date().toLocaleDateString('pt-BR')
    });
    setName('');
    setEmail('');
    setPassword('');
    setRole('operator');
    setShowAddModal(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1"><ShieldAlert size={10} /> SUPER ADMIN</span>;
      case 'admin':
        return <span className="bg-[#f5c518]/10 text-[#f5c518] text-[10px] font-bold px-2 py-0.5 rounded border border-[#f5c518]/20 flex items-center gap-1"><ShieldCheck size={10} /> ADMIN</span>;
      default:
        return <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1"><Shield size={10} /> OPERADOR</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Users className="text-[#f5c518]" size={28} />
            Gestão de Usuários
          </h1>
          <p className="text-gray-400 text-sm">Administre os acessos ao sistema e permissões</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#f5c518] hover:bg-[#e2b516] text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#f5c518]/10 cursor-pointer"
        >
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{users.filter(u => u.role === 'super_admin').length}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Super Admins</div>
          </div>
        </div>
        <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#f5c518]/10 rounded-lg flex items-center justify-center text-[#f5c518]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Administradores</div>
          </div>
        </div>
        <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{users.filter(u => u.role === 'operator').length}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Operadores</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#f5c518] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="p-4">Usuário</th>
                <th className="p-4">Papel</th>
                <th className="p-4">Desde</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(user => (
                <tr key={user.id} className="group hover:bg-white/2 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#f5c518] font-bold border border-white/10">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{user.name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Mail size={10} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="p-4">
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-600" />
                      {user.createdAt}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {user.email !== currentUserEmail && user.role !== 'super_admin' ? (
                        <button 
                          onClick={() => setDeleteConfirmUser(user)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                          title="Remover Usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center opacity-20" title="Protegido">
                          <ShieldCheck size={16} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500 italic text-sm">
                    Nenhum usuário encontrado com os critérios de busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-[#f5c518]" />
                <h2 className="font-display font-bold text-white">Novo Usuário</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@colegioreacaodf.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Defina uma senha provisória"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f5c518]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Nível de Permissão</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('operator')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      role === 'operator' 
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                        : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/10'
                    }`}
                  >
                    <Shield size={16} />
                    Operador
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      role === 'admin' 
                        ? 'bg-[#f5c518]/10 border-[#f5c518]/50 text-[#f5c518]' 
                        : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/10'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    Administrador
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-[#f5c518] hover:bg-[#e2b516] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check size={18} />
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom User Deletion Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-white">Remover Acesso</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tem certeza de que deseja revogar definitivamente o acesso ao sistema para <strong className="text-white">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})? Esta ação é irreversível.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
              >
                Remover Acesso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
