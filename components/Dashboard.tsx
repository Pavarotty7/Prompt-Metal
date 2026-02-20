
import React, { useMemo } from 'react';
import { Project, Transaction, UserRole, Vehicle, Employee, ViewState, DailyNote } from '../types';
import HelpTooltip from './HelpTooltip';
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Lock,
  Bell,
  Wrench,
  ShieldCheck,
  FileWarning,
  Plus,
  HardHat,
  Shield,
  Calendar,
  CheckCircle2,
  Car,
  CheckSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface DashboardProps {
  projects: Project[];
  transactions: Transaction[];
  vehicles?: Vehicle[];
  employees?: Employee[];
  notes?: DailyNote[];
  userRole?: UserRole;
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  transactions, 
  vehicles = [], 
  employees = [], 
  notes = [],
  userRole, 
  onNavigate 
}) => {
  const today = useMemo(() => new Date(), []);
  const isAdmin = userRole === 'admin';

  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === 'Em Andamento').length;
    const delayed = projects.filter(p => p.status === 'Atrasada' || (p.progress < 50 && new Date(p.endDate) < today)).length;
    
    const revenue = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { active, delayed, revenue, net: revenue - expenses };
  }, [projects, transactions, today]);

  const hasData = projects.length > 0 || transactions.length > 0 || vehicles.length > 0;

  const alerts = useMemo(() => {
    const finance = transactions.filter(t => {
      if (t.type !== 'expense' || t.status !== 'Pendente' || !t.date) return false;
      const dueDate = new Date(t.date);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });

    const maintenance = vehicles.filter(v => {
      if (!v.nextMaintenance) return false;
      const nextMaint = new Date(v.nextMaintenance);
      const diffDays = Math.ceil((nextMaint.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const inspection = vehicles.filter(v => {
      if (!v.annualInspectionDate) return false;
      const nextInsp = new Date(v.annualInspectionDate);
      const diffDays = Math.ceil((nextInsp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const insurance = vehicles.flatMap(v => 
      (v.documents || [])
        .filter(doc => doc.type === 'Seguro' && doc.expiryDate)
        .map(doc => ({ ...doc, vehicleModel: v.model, vehiclePlate: v.plate }))
    ).filter(doc => {
        if (!doc.expiryDate) return false;
        const expiry = new Date(doc.expiryDate);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    });

    const pendingNotes = notes.filter(n => !n.completed).slice(0, 5);

    return { finance, maintenance, inspection, insurance, pendingNotes };
  }, [transactions, vehicles, notes, today]);

  const projectProgressData = useMemo(() => projects.map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    progress: p.progress,
    status: p.status
  })), [projects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return '#10b981';
      case 'Em Andamento': return '#3b82f6';
      case 'Atrasada': return '#ef4444';
      default: return '#fbbf24';
    }
  };

  const progressFormatter = (val: number) => `${val}%`;

  if (!hasData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
           <LayoutDashboard size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Painel de Controle Vazio</h2>
        <p className="text-slate-600 max-w-md mb-8">
          Seus indicadores aparecerão aqui assim que a diretoria cadastrar a primeira obra ou realizar um lançamento financeiro.
        </p>
        {isAdmin && (
          <button 
             onClick={() => onNavigate('projects')} 
             className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
          >
             <Plus size={20} /> Começar por "Obras"
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Painel de Comando</h2>
          <p className="text-slate-600 font-medium">Gestão em tempo real da operação PromptMetal</p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
          Sync: Hoje, {today.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center">
              Obras Ativas <HelpTooltip title="Obras em Andamento" description="Projetos que já iniciaram e ainda não foram marcados como concluídos." />
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.active}</h3>
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center">
              Atrasos Críticos <HelpTooltip title="Obras com Atraso" description="Obras marcadas manualmente como atrasadas ou que ultrapassaram a data de término prevista." />
            </p>
            <h3 className="text-2xl font-black text-red-600 mt-1">{stats.delayed}</h3>
          </div>
          <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100">
            <AlertTriangle size={24} />
          </div>
        </div>

        {isAdmin ? (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center">
                  Receita <HelpTooltip title="Receita Acumulada" description="Soma de todos os recebimentos registrados no módulo financeiro." />
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">€ {stats.revenue.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center">
                  Saldo Líquido <HelpTooltip title="Resultado" description="Diferença entre todas as receitas e despesas lançadas até o momento." />
                </p>
                <h3 className={`text-2xl font-black mt-1 ${stats.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  € {stats.net.toLocaleString('pt-PT', {minimumFractionDigits: 2})}
                </h3>
              </div>
              <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <CheckCircle size={24} />
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-2 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Lock size={14}/> Indicadores Financeiros Restritos à Diretoria</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg flex items-center gap-3">
                <TrendingUp size={24} className="text-blue-500" /> Avanço Físico de Obras
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 10, fontWeight: '900'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} unit="%" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="progress" radius={[8, 8, 0, 0]} barSize={50}>
                  {projectProgressData.map((entry, index) => <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />)}
                  <LabelList 
                    dataKey="progress" 
                    position="top" 
                    formatter={progressFormatter}
                    style={{ fill: '#1e293b', fontSize: 11, fontWeight: '900', fontFamily: 'Inter, sans-serif' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg mb-6 flex items-center gap-3">
            <Bell size={24} className="text-amber-600" /> Central de Alertas
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {alerts.maintenance.map(v => (
              <div key={`maint-${v.id}`} className="p-4 rounded-2xl border bg-blue-50/80 border-blue-200 text-blue-900 flex items-start gap-4">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md"><Wrench size={16} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Revisão Pendente</p>
                  <p className="text-sm font-black uppercase tracking-tight mt-0.5">{v.model}</p>
                  <p className="text-[9px] font-bold mt-1 text-blue-800">Vence em: {new Date(v.nextMaintenance).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
            ))}

            {alerts.inspection.map(v => (
              <div key={`insp-${v.id}`} className="p-4 rounded-2xl border bg-red-50/80 border-red-200 text-red-900 flex items-start gap-4">
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-md"><ShieldCheck size={16} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Inspeção IPO</p>
                  <p className="text-sm font-black uppercase tracking-tight mt-0.5">{v.model}</p>
                  <p className="text-[9px] font-bold mt-1 text-red-800">Vence em: {new Date(v.annualInspectionDate!).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
            ))}

            {alerts.insurance.map((ins, idx) => (
              <div key={`insur-${idx}`} className="p-4 rounded-2xl border bg-emerald-50/80 border-emerald-200 text-emerald-900 flex items-start gap-4">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md"><Car size={16} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Seguro Renovação</p>
                  <p className="text-sm font-black uppercase tracking-tight mt-0.5">{ins.vehicleModel}</p>
                  <p className="text-[9px] font-bold mt-1 text-emerald-800">Placa: {ins.vehiclePlate} | Expira: {new Date(ins.expiryDate!).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
            ))}

            {alerts.finance.map(p => (
              <div key={`pay-${p.id}`} className="p-4 rounded-2xl border bg-amber-50/80 border-amber-200 text-amber-900 flex items-start gap-4">
                <div className="p-2 bg-amber-600 text-white rounded-xl shadow-md"><DollarSign size={16} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Fatura Próxima</p>
                  <p className="text-sm font-black uppercase tracking-tight mt-0.5">{p.description}</p>
                  <p className="text-[9px] font-bold mt-1 text-amber-800">Valor: € {p.amount.toLocaleString()} | {new Date(p.date).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
            ))}

            {alerts.pendingNotes.map(n => (
              <div key={`note-${n.id}`} onClick={() => onNavigate('notes')} className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-slate-900 flex items-start gap-4 cursor-pointer hover:bg-slate-100 transition-all">
                <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md"><CheckSquare size={16} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Anotação Pendente</p>
                  <p className="text-sm font-black uppercase tracking-tight mt-0.5 line-clamp-2">{n.content}</p>
                  <p className="text-[9px] font-bold mt-1 text-slate-400">{new Date(n.date).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
            ))}

            {alerts.maintenance.length === 0 && alerts.inspection.length === 0 && alerts.finance.length === 0 && alerts.insurance.length === 0 && alerts.pendingNotes.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sem alertas críticos para este período</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
