
import React, { useMemo, useState, useEffect } from 'react';
import { ViewState, UserRole, Project, Transaction, Employee, Vehicle } from '../types';
import HelpTooltip from './HelpTooltip';
import { 
  LayoutDashboard, 
  HardHat, 
  Wallet, 
  Truck, 
  FileCheck, 
  BrainCircuit,
  ArrowRight,
  Users,
  ClipboardList,
  CreditCard,
  Lock,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Bell,
  CheckCircle2,
  X,
  StickyNote
} from 'lucide-react';

interface HomeLandingProps {
  onNavigate: (view: ViewState) => void;
  userRole: UserRole;
  projects: Project[];
  transactions: Transaction[];
  employees: Employee[];
  vehicles: Vehicle[];
}

const HomeLanding: React.FC<HomeLandingProps> = ({ onNavigate, userRole, projects, transactions, employees, vehicles }) => {
  const isAdmin = userRole === 'admin';

  const kpis = useMemo(() => {
    const activeProjects = projects?.filter(p => p.status === 'Em Andamento').length || 0;
    const totalRevenue = transactions?.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const totalEmployees = employees?.length || 0;
    const fleetStatus = vehicles?.filter(v => v.status === 'Operacional').length || 0;
    const totalVehicles = vehicles?.length || 0;

    return [
      { label: 'Obras Ativas', value: activeProjects, icon: <HardHat size={14} />, color: 'text-blue-400', help: 'Quantidade de obras com status "Em Andamento".' },
      { label: 'Equipe Total', value: totalEmployees, icon: <Users size={14} />, color: 'text-purple-400', help: 'Total de colaboradores cadastrados na aba Equipe.' },
      { label: 'Frota Operacional', value: `${fleetStatus}/${totalVehicles}`, icon: <Truck size={14} />, color: 'text-emerald-400', help: 'Veículos disponíveis para uso imediato.' },
      ...(isAdmin ? [{ label: 'Receita Total', value: `€${(totalRevenue/1000).toFixed(1)}k`, icon: <TrendingUp size={14} />, color: 'text-amber-400', help: 'Soma total de todos os lançamentos de entrada.' }] : [])
    ];
  }, [projects, transactions, employees, vehicles, isAdmin]);

  const allModules = [
    {
      id: 'dashboard' as ViewState,
      title: 'Dashboard Gerencial',
      description: 'Visão panorâmica de KPIs, alertas e saúde financeira da franquia.',
      icon: <LayoutDashboard size={28} />,
      gradient: 'from-blue-600 to-indigo-700',
      help: 'Resumo visual de toda a operação em tempo real.'
    },
    {
      id: 'projects' as ViewState,
      title: 'Obras & Produção',
      description: 'Gestão de cronogramas, progresso físico e diário de obras em tempo real.',
      icon: <HardHat size={28} />,
      gradient: 'from-amber-500 to-orange-600',
      help: 'Controle de custos e prazos de cada projeto individualmente.'
    },
    {
      id: 'team' as ViewState,
      title: 'Equipe & Organograma',
      description: 'Estrutura administrativa e operacional validada para padrões de franquia.',
      icon: <Users size={28} />,
      gradient: 'from-pink-600 to-rose-700',
      help: 'Cadastre seus funcionários aqui antes de lançar o ponto.'
    },
    {
      id: 'notes' as ViewState,
      title: 'Anotações Diárias',
      description: 'Registro rápido de tarefas, lembretes e observações críticas de campo.',
      icon: <StickyNote size={28} />,
      gradient: 'from-amber-400 to-orange-500',
      help: 'Mantenha um diário de bordo com prioridades.'
    },
    {
      id: 'finance' as ViewState,
      title: 'Gestão Financeira',
      description: 'Fluxo de caixa, extratos detalhados e controle de custos diretos e indiretos.',
      icon: <Wallet size={28} />,
      gradient: 'from-emerald-600 to-green-800',
      help: 'Entradas e saídas de capital da empresa.'
    },
    {
      id: 'timesheet' as ViewState,
      title: 'Folha de Ponto',
      description: 'Controle rigoroso de presenças, diárias e horas extras da equipe de campo.',
      icon: <ClipboardList size={28} />,
      gradient: 'from-teal-500 to-emerald-600',
      help: 'Lançamento diário de presença para cálculo automático de pagamentos.'
    },
    {
      id: 'corporate-cards' as ViewState,
      title: 'Cartões Corporativos',
      description: 'Monitoramento de limites e despesas imediatas para compras em obra.',
      icon: <CreditCard size={28} />,
      gradient: 'from-cyan-600 to-blue-700',
      help: 'Gestão de cartões para compras emergenciais em campo.'
    },
    {
      id: 'fleet' as ViewState,
      title: 'Frota & Logística',
      description: 'Rastreio de manutenções, inspeções e eficiência de combustível da frota.',
      icon: <Truck size={28} />,
      gradient: 'from-slate-600 to-slate-800',
      help: 'Controle de gastos com combustível e datas de revisão.'
    },
    {
      id: 'ai-analysis' as ViewState,
      title: 'Consultor AI',
      description: 'Análise preditiva e insights estratégicos gerados por inteligência artificial.',
      icon: <BrainCircuit size={28} />,
      gradient: 'from-indigo-600 to-violet-900',
      help: 'Deixe a IA analisar seus dados e sugerir melhorias.'
    }
  ];

  const allowedGuestModules = ['dashboard', 'projects', 'team', 'notes'];

  return (
    <div className="min-h-screen bg-[#060a14] flex flex-col items-center p-6 md:p-12 animate-fade-in relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl w-full flex flex-col items-center">
        <header className="w-full flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">Prompt</span>
              <span className="text-4xl md:text-5xl font-black tracking-tighter text-amber-500 uppercase">Metal</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              <ShieldCheck size={14} className="text-amber-500/70" />
              Portal de Operações de Franquia
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-2xl shadow-2xl">
            <div className="flex gap-1 overflow-x-auto max-w-full">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="px-4 py-2 border-r border-white/5 last:border-0 flex flex-col whitespace-nowrap min-w-[120px]">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                    {kpi.icon} {kpi.label} <HelpTooltip title={kpi.label} description={kpi.help} />
                  </span>
                  <span className={`text-sm font-black ${kpi.color}`}>{kpi.value}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-16">
          {allModules.map((module) => {
            const isAllowed = isAdmin || allowedGuestModules.includes(module.id);
            
            return (
              <div
                key={module.id}
                onClick={() => isAllowed ? onNavigate(module.id) : null}
                onKeyDown={(e) => {
                  if (isAllowed && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onNavigate(module.id);
                  }
                }}
                tabIndex={isAllowed ? 0 : -1}
                role="button"
                aria-disabled={!isAllowed}
                className={`group relative text-left transition-all duration-300 ${isAllowed ? 'hover:-translate-y-2 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-[2rem] border border-white/10 group-hover:border-white/20 transition-all duration-500"></div>
                
                <div className="relative p-8 flex flex-col h-full min-h-[200px]">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl text-white shadow-2xl bg-gradient-to-br ${module.gradient} group-hover:scale-110 transition-transform duration-500`}>
                      {module.icon}
                    </div>
                    <div className="flex items-center gap-2">
                       <HelpTooltip title={module.title} description={module.help} />
                       <div className={`p-2 rounded-full border transition-all ${isAllowed ? 'border-white/10 text-slate-400 group-hover:bg-white/10 group-hover:text-white' : 'border-white/5 text-slate-700'}`}>
                         {isAllowed ? <ArrowRight size={18} /> : <Lock size={18} />}
                       </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className={`text-lg font-black uppercase tracking-tight mb-2 transition-colors ${isAllowed ? 'text-white' : 'text-slate-600'}`}>
                      {module.title}
                    </h3>
                    <p className={`text-xs leading-relaxed font-medium ${isAllowed ? 'text-slate-300' : 'text-slate-700'}`}>
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeLanding;
