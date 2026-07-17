/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrdemServico, Equipamento, ChamadoSuporte, LogAuditoria, Funcionario, RegistroPonto, User } from './types';

// Seed initial Equipments
export const INITIAL_EQUIPAMENTOS: Equipamento[] = [
  {
    id: 'EQ-001',
    name: 'Ar Condicionado Central - Bloco A',
    category: 'Manutenção',
    location: 'Telhado / Bloco A',
    status: 'operacional',
    acquisitionDate: '10/01/2023',
    lastMaintenanceDate: '15/05/2024',
    observations: 'Equipamento em bom estado. Filtros limpos recentemente.'
  },
  {
    id: 'EQ-002',
    name: 'Projetor Multimídia - Sala 04',
    category: 'Informático',
    location: 'Sala 04 / Bloco B',
    status: 'operacional',
    acquisitionDate: '05/03/2024',
    lastMaintenanceDate: '20/06/2024',
    observations: 'Lâmpada com 150h de uso.'
  },
  {
    id: 'EQ-003',
    name: 'Quadro Elétrico - Pavimento Térreo',
    category: 'Elétrico',
    location: 'Corredor Central',
    status: 'operacional',
    acquisitionDate: '15/11/2022',
    lastMaintenanceDate: '10/04/2024',
    observations: 'Disjuntores térmicos revisados.'
  }
];

// Seed initial Orders of Service (OS)
export const INITIAL_ORDENS: OrdemServico[] = [];

// Seed initial Support Tickets (Suporte Técnico)
export const INITIAL_SUPORTE: ChamadoSuporte[] = [];

// Seed initial Employees (Funcionários)
export const INITIAL_FUNCIONARIOS: Funcionario[] = [];

// Seed initial Audit Logs
export const INITIAL_AUDITORIA: LogAuditoria[] = [];

// Helper to generate monthly clock-in timesheet records for a given employee & date
export function generateTimesheetForMonth(employee: Funcionario, year: number, month: number): RegistroPonto[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const records: RegistroPonto[] = [];
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dayName = weekdays[currentDate.getDay()];
    const dateStr = `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`;

    // If weekend, usually off unless specified
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

    if (employee.status === 'vacation') {
      records.push({
        id: `PONT-${employee.id}-${year}-${month}-${day}`,
        funcionarioId: employee.id,
        date: dateStr,
        dayOfWeek: dayName,
        entryTime: '--:--',
        exitTime: '--:--',
        interval: '--:--',
        hoursWorked: 0,
        overtime: 0,
        undertime: 0,
        status: 'vacation',
        observations: 'Férias regulamentares'
      });
    } else if (isWeekend) {
      records.push({
        id: `PONT-${employee.id}-${year}-${month}-${day}`,
        funcionarioId: employee.id,
        date: dateStr,
        dayOfWeek: dayName,
        entryTime: '--:--',
        exitTime: '--:--',
        interval: '--:--',
        hoursWorked: 0,
        overtime: 0,
        undertime: 0,
        status: 'normal',
        observations: 'Final de semana'
      });
    } else {
      // Simulate normal work records with small random fluctuations to look super professional
      // Base hours: Entry 08:00, Exit 17:00, Interval 01:00
      const [entryH, entryM] = employee.workHours.entry.split(':').map(Number);
      const [exitH, exitM] = employee.workHours.exit.split(':').map(Number);

      // Random variation (-5 to +10 mins)
      const entryRand = Math.floor(Math.random() * 15) - 5;
      const exitRand = Math.floor(Math.random() * 15) - 5;

      const realEntryTime = addMinutesToTime(employee.workHours.entry, entryRand);
      const realExitTime = addMinutesToTime(employee.workHours.exit, exitRand);
      const intervalStr = employee.workHours.interval;

      // Calculate total worked hours (Exit - Entry - Interval)
      const totalMinutes = timeDiffMinutes(realEntryTime, realExitTime) - timeToMinutes(intervalStr);
      const hoursWorked = Math.max(0, parseFloat((totalMinutes / 60).toFixed(2)));

      // Compare to standard 8-hour workday
      const standardHours = 8.0;
      let overtime = 0;
      let undertime = 0;

      if (hoursWorked > standardHours) {
        overtime = parseFloat((hoursWorked - standardHours).toFixed(2));
      } else if (hoursWorked < standardHours) {
        undertime = parseFloat((standardHours - hoursWorked).toFixed(2));
      }

      // Add small percentage of random absences
      const isMissing = Math.random() < 0.03; // 3% chance of missing
      if (isMissing) {
        records.push({
          id: `PONT-${employee.id}-${year}-${month}-${day}`,
          funcionarioId: employee.id,
          date: dateStr,
          dayOfWeek: dayName,
          entryTime: '--:--',
          exitTime: '--:--',
          interval: '--:--',
          hoursWorked: 0,
          overtime: 0,
          undertime: 8.0,
          status: 'missing',
          observations: 'Falta injustificada'
        });
      } else {
        records.push({
          id: `PONT-${employee.id}-${year}-${month}-${day}`,
          funcionarioId: employee.id,
          date: dateStr,
          dayOfWeek: dayName,
          entryTime: realEntryTime,
          exitTime: realExitTime,
          interval: intervalStr,
          hoursWorked,
          overtime,
          undertime,
          status: 'normal',
          observations: entryRand > 5 ? 'Atraso leve na entrada' : 'Horário normal'
        });
      }
    }
  }

  return records;
}

// Utility time math helpers
function timeToMinutes(t: string): number {
  if (!t || t.includes('--')) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalM = h * 60 + m + minutes;
  const newH = Math.floor(totalM / 60) % 24;
  const newM = totalM % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(newH)}:${pad(newM)}`;
}

function timeDiffMinutes(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

// Local Storage Managers
const LS_PREFIX = 'colegio_reacao_';
import { IndexedDBService } from './services/IndexedDBService';

export function getLocalStorageData<T>(key: string, initial: T): T {
  try {
    const val = localStorage.getItem(LS_PREFIX + key);
    if (val) {
      return JSON.parse(val);
    }
  } catch (e) {
    console.error('Error reading localStorage for key', key, e);
  }
  return initial;
}

export function setLocalStorageData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
    // Replicate to IndexedDB for offline-first resilience
    IndexedDBService.setItem(LS_PREFIX + key, data).catch((err) => {
      console.warn('[IndexedDB Error]', err);
    });
  } catch (e) {
    console.error('Error writing localStorage for key', key, e);
  }
}

// Seed initial Users
export const INITIAL_USERS: User[] = [
  {
    id: 'U-01',
    email: 'mecanografia@colegioreacaodf.com',
    name: 'Super Admin',
    role: 'super_admin',
    createdAt: new Date().toLocaleDateString('pt-BR'),
    password: 'admin' // Default password
  }
];

// Initialize system DB in localStorage if empty and export getters/setters
export function initializeDB() {
  if (!localStorage.getItem(LS_PREFIX + 'users')) {
    setLocalStorageData('users', INITIAL_USERS);
  }
  if (!localStorage.getItem(LS_PREFIX + 'ordens')) {
    setLocalStorageData('ordens', INITIAL_ORDENS);
  }
  if (!localStorage.getItem(LS_PREFIX + 'equipamentos')) {
    setLocalStorageData('equipamentos', INITIAL_EQUIPAMENTOS);
  }
  if (!localStorage.getItem(LS_PREFIX + 'suporte')) {
    setLocalStorageData('suporte', INITIAL_SUPORTE);
  }
  if (!localStorage.getItem(LS_PREFIX + 'funcionarios')) {
    setLocalStorageData('funcionarios', INITIAL_FUNCIONARIOS);
  }
  if (!localStorage.getItem(LS_PREFIX + 'auditoria')) {
    setLocalStorageData('auditoria', INITIAL_AUDITORIA);
  }
}
