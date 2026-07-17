/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'operator' | 'guest';
  createdAt: string;
  password?: string; // Only for local auth simulation
}

export interface UserSession {
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'operator' | 'guest';
  password?: string;
}

export type OSStatus = 'aberto' | 'em_andamento' | 'concluido' | 'arquivado';
export type OSConstraint = 'baixa' | 'media' | 'alta' | 'critica';

export interface OrdemServico {
  id: string; // Ex: OS-001
  title?: string; // Título da OS
  equipId: string;
  equipName: string;
  category: string;
  problemDescription: string;
  status: OSStatus;
  priority: OSConstraint;
  responsible: string;
  openingDate: string; // dd/mm/aaaa
  closingDate?: string; // dd/mm/aaaa
  cost: number;
  location?: string; // Local do equipamento
  requester?: string; // Solicitante da OS
  observations?: string; // Observações
  photoUrl?: string; // Foto do equipamento com defeito
  history?: {
    date: string;
    action: string;
    user: string;
  }[];
}

export interface Equipamento {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'operacional' | 'em_manutencao' | 'danificado' | 'aposentado';
  acquisitionDate: string;
  lastMaintenanceDate?: string;
  photoUrl?: string;
  sectorCode?: string;
  number?: string;
  conservationState?: string;
  observations?: string;
}

export interface ChamadoSuporte {
  id: string;
  title: string;
  description: string;
  category: 'rede' | 'computador' | 'impressora' | 'software' | 'outros';
  priority: OSConstraint;
  status: 'aberto' | 'em_atendimento' | 'resolvido' | 'fechado';
  openingDate: string;
  closingDate?: string;
  requester: string;
  responseText?: string;
}

export interface LogAuditoria {
  id: string;
  userId: string;
  userName: string;
  action: string; // Criou OS, Editou Equipamento, etc.
  timestamp: string; // dd/mm/aaaa hh:mm:ss
  targetType: 'os' | 'equipamento' | 'suporte' | 'funcionario' | 'config' | 'ponto' | 'sistema';
  targetId: string;
  details: string;
}

export type FuncionarioStatus = 'active' | 'inactive' | 'vacation' | 'away';

export interface Funcionario {
  id: string; // Ex: F-001
  name: string;
  cpf: string;
  matricula: string;
  role: string;
  sector: string;
  admissionDate: string; // dd/mm/aaaa
  workHours: {
    entry: string; // hh:mm
    exit: string; // hh:mm
    interval: string; // hh:mm (ex: "01:00")
  };
  weeklyHours: number;
  phone: string;
  email: string;
  status: FuncionarioStatus;
  avatarUrl?: string;
}

export interface RegistroPonto {
  id: string;
  funcionarioId: string;
  date: string; // dd/mm/aaaa
  dayOfWeek: string; // Segunda, Terça, etc.
  entryTime: string; // hh:mm
  exitTime: string; // hh:mm
  interval: string; // hh:mm duration, e.g. "01:00"
  hoursWorked: number; // decimal hours
  overtime: number; // decimal hours
  undertime: number; // decimal hours
  status: 'normal' | 'missing' | 'late' | 'vacation';
  observations?: string;
}

export interface Emprestimo {
  id: string;
  equipId: string;
  equipName: string;
  responsibleName: string;
  withdrawalDate: string; // dd/mm/aaaa hh:mm
  returnDate?: string; // dd/mm/aaaa hh:mm
  purpose: string;
  observations?: string;
  returnObservations?: string;
  signatureUrl: string; // Base64 data URL for the withdrawal signature
  returnSignatureUrl?: string; // Base64 data URL for the return signature
  status: 'ativo' | 'devolvido';
}
