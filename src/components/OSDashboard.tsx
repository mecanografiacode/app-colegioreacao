/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { FileText, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { OrdemServico } from '../types';

interface OSDashboardProps {
  ordens: OrdemServico[];
  onNewOS?: () => void;
}

export default function OSDashboard({ ordens, onNewOS }: OSDashboardProps) {
  // Statistics Calculations
  const stats = useMemo(() => {
    const total = ordens.length;
    const emAndamento = ordens.filter(o => o.status === 'em_andamento').length;
    const concluidas = ordens.filter(o => o.status === 'concluido').length;
    const aberto = ordens.filter(o => o.status === 'aberto').length;
    
    // Total Cost is the sum of all completed and non-completed (completed usually have the cost)
    const custoTotal = ordens.reduce((sum, o) => sum + (o.cost || 0), 0);

    return { total, emAndamento, concluidas, aberto, custoTotal };
  }, [ordens]);

  // Costs by category
  const categoryCosts = useMemo(() => {
    const categories = ['Mobiliário', 'Elétrico', 'Manutenção', 'Informático'];
    const costs: { [key: string]: number } = {
      'Mobiliário': 0,
      'Elétrico': 0,
      'Manutenção': 0,
      'Informático': 0
    };

    ordens.forEach(o => {
      const cat = o.category;
      if (costs[cat] !== undefined) {
        costs[cat] += (o.cost || 0);
      } else {
        // Fallback for custom categories
        costs[cat] = (o.cost || 0);
      }
    });

    return costs;
  }, [ordens]);

  // Formatter for Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Pie Chart calculations
  const pieData = useMemo(() => {
    const total = stats.concluidas + stats.emAndamento + stats.aberto;
    if (total === 0) return { pctConcluido: 0, pctAndamento: 0, pctAberto: 0 };
    
    return {
      pctConcluido: (stats.concluidas / total) * 100,
      pctAndamento: (stats.emAndamento / total) * 100,
      pctAberto: (stats.aberto / total) * 100,
    };
  }, [stats]);

  // Dynamic SVG Pie Chart Arc Calculation helper
  const renderPieChart = () => {
    const total = stats.concluidas + stats.emAndamento + stats.aberto;
    if (total === 0) {
      return (
        <svg viewBox="0 0 100 100" className="w-48 h-48 mx-auto">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#3f3f46" strokeWidth="10" />
          <text x="50" y="55" textAnchor="middle" fill="#71717a" className="text-[10px] font-sans">Sem Dados</text>
        </svg>
      );
    }

    // Stacked Stroke Chart (Donut Chart)
    const radius = 30;
    const circumference = 2 * Math.PI * radius; // ~188.49
    
    // Angles/Lengths
    const pConcluido = stats.concluidas / total;
    const pAndamento = stats.emAndamento / total;
    const pAberto = stats.aberto / total;

    const strokeConcluido = pConcluido * circumference;
    const strokeAndamento = pAndamento * circumference;
    const strokeAberto = pAberto * circumference;

    // Offsets
    const offsetConcluido = 0;
    const offsetAndamento = strokeConcluido;
    const offsetAberto = strokeConcluido + strokeAndamento;

    return (
      <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-md">
        {/* Background circle */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#27272a" strokeWidth="10" />
        
        {/* Concluido (Green) */}
        {stats.concluidas > 0 && (
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="10"
            strokeDasharray={`${strokeConcluido} ${circumference}`}
            strokeDashoffset={-offsetConcluido}
            transform="rotate(-90 50 50)"
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* Em Andamento (Orange) */}
        {stats.emAndamento > 0 && (
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="none" 
            stroke="#f97316" 
            strokeWidth="10"
            strokeDasharray={`${strokeAndamento} ${circumference}`}
            strokeDashoffset={-offsetAndamento}
            transform="rotate(-90 50 50)"
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* Aberto (Yellow) */}
        {stats.aberto > 0 && (
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="none" 
            stroke="#f5c518" 
            strokeWidth="10"
            strokeDasharray={`${strokeAberto} ${circumference}`}
            strokeDashoffset={-offsetAberto}
            transform="rotate(-90 50 50)"
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
    );
  };

  // Bar Chart Coordinate Calculations
  // Categories: Mobiliário, Elétrico, Manutenção, Informático
  const maxCost = useMemo(() => {
    const costs = Object.keys(categoryCosts).map(k => categoryCosts[k]) as number[];
    const max = Math.max(...costs, 100); // fallback to min 100 for scale
    return Math.ceil(max / 40) * 40; // round up to multiple of 40
  }, [categoryCosts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <span className="w-1 h-6 bg-[#f5c518] rounded-full"></span>
            Visão Geral das Ordens de Serviço
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1 ml-3">Estatísticas consolidadas e métricas de desempenho em tempo real</p>
        </div>

        {onNewOS && (
          <button
            onClick={onNewOS}
            className="bg-[#f5c518] hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Clock size={14} className="animate-pulse" />
            Abrir Nova Ordem
          </button>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total OS */}
        <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total de OS</span>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#f5c518]/10 flex items-center justify-center border border-[#f5c518]/20">
            <FileText size={20} className="text-[#f5c518]" />
          </div>
        </div>

        {/* Em Andamento */}
        <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Em Andamento</span>
            <div className="text-3xl font-bold text-white">{stats.emAndamento}</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Clock size={20} className="text-orange-500" />
          </div>
        </div>

        {/* Concluídas */}
        <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Concluídas</span>
            <div className="text-3xl font-bold text-white">{stats.concluidas}</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
        </div>

        {/* Custo Total */}
        <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Custo Total</span>
            <div className="text-2xl font-bold text-white truncate max-w-[140px]" title={formatCurrency(stats.custoTotal)}>
              {formatCurrency(stats.custoTotal)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <DollarSign size={20} className="text-amber-500" />
          </div>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut Chart Card */}
        <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Status das Ordens</h3>
            <div className="h-px bg-white/5 my-3" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-6">
            {/* SVG Render */}
            <div className="relative flex items-center justify-center">
              {renderPieChart()}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Resolvidas</span>
                <span className="text-xl font-bold text-white">
                  {stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Labels Legend */}
            <div className="space-y-3.5 text-xs text-gray-300 w-full sm:w-auto shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-medium text-gray-200">Concluído:</span>
                </div>
                <span className="font-semibold text-white">{stats.concluidas}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                  <span className="font-medium text-gray-200">Em Andamento:</span>
                </div>
                <span className="font-semibold text-white">{stats.emAndamento}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#f5c518] inline-block" />
                  <span className="font-medium text-gray-200">Aberto:</span>
                </div>
                <span className="font-semibold text-white">{stats.aberto}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="bg-[#18181b] p-5 rounded-xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Custos por Categoria</h3>
            <div className="h-px bg-white/5 my-3" />
          </div>

          <div className="pt-2">
            {/* Custom Responsive SVG Bar Chart */}
            <svg viewBox="0 0 400 200" className="w-full h-48">
              {/* Grid Y lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="60" x2="380" y2="60" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="380" y2="140" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
              {/* Baseline */}
              <line x1="40" y1="160" x2="380" y2="160" stroke="#3f3f46" strokeWidth="1.5" />

              {/* Y Axis ticks */}
              <text x="30" y="24" textAnchor="end" fill="#71717a" className="text-[9px] font-mono">
                {formatCurrency(maxCost)}
              </text>
              <text x="30" y="64" textAnchor="end" fill="#71717a" className="text-[9px] font-mono">
                {formatCurrency(maxCost * 0.75)}
              </text>
              <text x="30" y="104" textAnchor="end" fill="#71717a" className="text-[9px] font-mono">
                {formatCurrency(maxCost * 0.5)}
              </text>
              <text x="30" y="144" textAnchor="end" fill="#71717a" className="text-[9px] font-mono">
                {formatCurrency(maxCost * 0.25)}
              </text>
              <text x="30" y="164" textAnchor="end" fill="#71717a" className="text-[9px] font-mono">
                R$ 0
              </text>

              {/* Bars render */}
              {['Mobiliário', 'Elétrico', 'Manutenção', 'Informático'].map((cat, idx) => {
                const costValue = categoryCosts[cat] || 0;
                
                // Max SVG chart height = 140px (from y=20 to y=160)
                const barHeight = maxCost > 0 ? (costValue / maxCost) * 140 : 0;
                const barY = 160 - barHeight;
                const barWidth = 34;
                const barX = 70 + idx * 80;

                return (
                  <g key={cat} className="group cursor-pointer">
                    {/* Tooltip background (shows on hover) */}
                    <rect 
                      x={barX - 10} 
                      y={barY - 22} 
                      width="54" 
                      height="16" 
                      rx="4" 
                      fill="#09090b" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" 
                    />
                    <text 
                      x={barX + 17} 
                      y={barY - 11} 
                      textAnchor="middle" 
                      fill="#ffffff" 
                      className="text-[8px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    >
                      {costValue.toFixed(2)}
                    </text>

                    {/* Bar rectangle */}
                    <rect 
                      x={barX} 
                      y={barY} 
                      width={barWidth} 
                      height={Math.max(barHeight, 1.5)} // min height 1.5px to see even tiny values
                      rx="3" 
                      fill="#f5c518" 
                      className="transition-all duration-500 ease-out hover:fill-amber-400"
                    />

                    {/* X axis labels */}
                    <text 
                      x={barX + 17} 
                      y="178" 
                      textAnchor="middle" 
                      fill="#a1a1aa" 
                      className="text-[9px] font-sans font-medium"
                    >
                      {cat}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-3.5 h-2 bg-[#f5c518] rounded" />
              <span className="text-[10px] text-gray-400 font-medium font-sans">Custo (R$)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
