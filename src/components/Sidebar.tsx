/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileText, 
  Package, 
  Headphones, 
  ShieldCheck, 
  Settings, 
  Users, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';
import { UserSession } from '../types';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  user: UserSession;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  user,
  onLogout,
  collapsed,
  setCollapsed,
  mobileMenuOpen = false,
  setMobileMenuOpen
}: SidebarProps) {
  const [schoolName, setSchoolName] = React.useState(() => {
    return localStorage.getItem('colegio_reacao_school_name') || 'Colégio Reação';
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      setSchoolName(localStorage.getItem('colegio_reacao_school_name') || 'Colégio Reação');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const initials = schoolName
    .split(' ')
    .filter(word => word.length > 2)
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const menuItems = [
    { id: 'os', label: 'Ordens de Serviço', icon: FileText },
    { id: 'equipamentos', label: 'Equipamentos', icon: Package },
    { id: 'suporte', label: 'Suporte Técnico', icon: Headphones },
    { id: 'auditoria', label: 'Auditoria', icon: ShieldCheck },
    { id: 'funcionarios', label: 'Funcionários', icon: Users, restrictedEmails: ['colinaadm201@gmail.com', 'arthurrfgomes@gmail.com'] },
    { id: 'usuarios', label: 'Usuários', icon: ShieldCheck, restricted: true },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    // 0. Guests see everything to visualize functionality (mock data is shown in App.tsx)
    if (user.role === 'guest') return true;

    // 1. Custom restriction by specific emails (Absolute Priority)
    if (item.restrictedEmails) {
      const userEmailLower = user.email?.toLowerCase();
      if (!item.restrictedEmails.some(e => e.toLowerCase() === userEmailLower)) {
        return false;
      }
    }
    
    // 2. Role-based restriction (Super Admin only for specific items)
    if (item.restricted && user.role !== 'super_admin') return false;
    
    return true;
  });

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen transition-all duration-300 z-50 flex flex-col border-r border-white/10 no-print
        ${collapsed ? 'md:w-20' : 'md:w-64'} 
        ${mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64'}
        bg-[#111113] text-white`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden pl-1">
          <img 
            src="https://i.imgur.com/4XiztTt.png" 
            alt="Logo" 
            className="w-20 h-14 object-contain shrink-0" 
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Desktop Collapse Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          title={collapsed ? "Expandir menu" : "Colapsar menu"}
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>

        {/* Mobile Close Button */}
        <button 
          onClick={() => { if (setMobileMenuOpen) setMobileMenuOpen(false); }}
          className="md:hidden p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          title="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Menu (Scrollable part) */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
        {visibleMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (setMobileMenuOpen) setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-full text-sm font-medium transition-all cursor-pointer group
                  ${isActive 
                    ? 'bg-[#f5c518] text-black shadow-md shadow-amber-500/10' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title={item.label}
              >
                <IconComponent 
                  size={19} 
                  className={`shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} 
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {/* User profile preview */}
        <div className="flex items-center gap-2.5 overflow-hidden px-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-bold text-xs">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{user.name}</span>
              <span className="text-[10px] text-[#a1a1aa] truncate" title={user.email}>{user.email}</span>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-medium text-red-500 hover:text-red-400 hover:underline transition-all cursor-pointer text-left justify-start"
          title="Sair do sistema"
        >
          <LogOut size={13} className="shrink-0 text-red-500" />
          {!collapsed && <span>Sair do Sistema</span>}
        </button>

        {/* Copyright & Version */}
        {!collapsed && (
          <p className="text-[10px] text-[#a1a1aa] text-center pt-2 border-t border-white/5">
            © 2026 {schoolName}<br />
            Versão 1.5.0
          </p>
        )}
      </div>
    </aside>
  );
}
