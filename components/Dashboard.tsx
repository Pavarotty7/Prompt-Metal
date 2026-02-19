
import React, { useMemo, useRef } from 'react';
import { Project, Transaction, UserRole, Vehicle, Employee, ViewState, ChecklistItem } from '../types';
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
  CheckSquare,
  Database,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { databaseService } from '../services/databaseService';

interface DashboardProps {
  projects: Project[];
  transactions: Transaction[];
  vehicles?: Vehicle[];
  employees?: Employee[];
  complianceItems?: ChecklistItem[];
  userRole?: UserRole;
  onNavigate: (view: ViewState) => void;
  onRefreshData?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  transactions, 
  vehicles = [], 
  employees = [], 
  complianceItems = [],
  userRole, 
  onNavigate,
  onRefreshData
}) => {
  const today = useMemo(() => new Date(), []);
  const isAdmin = userRole === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (t.type !== 'expense' || t.status !== 'Pendente') return false;
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
        const expiry = new Date(doc.expiryDate!);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    });

    return { finance, maintenance, inspection, insurance };
  }, [transactions, vehicles, today]);

  const criticalChecklistItems = useMemo(() => 
    complianceItems.filter(item => !item.checked && item.critical).slice(0, 5),
  [complianceItems]);

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

  const handleExportBackup = () => {
    const data = databaseService.exportDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PromptMetal_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = databaseService.importDatabase(content);
      if (success) {
        alert("Backup restaurado com sucesso! O sistema será atualizado.");
        if (onRefreshData) onRefreshData();
      } else {
        alert("Falha ao importar backup. Verifique se o arquivo é válido.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
        <div className="flex gap-4">
            {isAdmin && (
            <button 
                onClick={() => onNavigate('projects')} 
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
            >
                <Plus size={20} /> Começar por "Obras"
            </button>
            )}
            {isAdmin && (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Upload size={20} /> Restaurar Backup
                </button>
            )}
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
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
        <div className="flex gap-3">
            {isAdmin && (
               <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <button 
                        onClick={handleExportBackup}
                        className="p-2 text-slate-600 hover:text-emerald-600 transition-all"
                        title="Exportar Backup JSON"
                    >
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-600 hover:text-blue-600 transition-all"
                        title="Restaurar do Arquivo"
                    >
                        <Upload size={18} />
                    </button>
               </div>
            )}
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
            Sync: {today.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
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

            {alerts.maintenance.length === 0 && alerts.inspection.length === 0 && alerts.finance.length === 0 && alerts.insurance.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sem alertas críticos para este período</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in flex flex-col">
            <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg flex items-center gap-3">
                <Shield size={24} className="text-emerald-600" /> Itens de Conformidade
            </h3>
            <button onClick={() => onNavigate('compliance')} className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline">Ver Todos</button>
            </div>
            <div className="space-y-4 flex-1">
                {criticalChecklistItems.map(item => (
                    <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-emerald-500 transition-all flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-xl border border-slate-200 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <CheckSquare size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">{item.text}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Prazo: {new Date(item.deadline).toLocaleDateString('pt-PT')}</p>
                            </div>
                        </div>
                        <span className="text-[8px] font-black bg-red-100 text-red-800 px-2 py-1 rounded-full uppercase tracking-widest border border-red-200">Crítico</span>
                    </div>
                ))}
                {criticalChecklistItems.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <CheckCircle2 size={40} className="mx-auto text-emerald-600 mb-4 opacity-20" />
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Conformidade em dia</p>
                    </div>
                )}
            </div>
        </div>

        {isAdmin && (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in">
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg mb-8 flex items-center gap-3">
                    <Database size={24} className="text-indigo-600" /> Utilidades de Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={handleExportBackup}
                        className="flex flex-col items-center justify-center p-8 bg-slate-900 text-white rounded-[2rem] hover:bg-black transition-all group shadow-xl"
                    >
                        <Download size={32} className="text-emerald-500 group-hover:scale-110 transition-transform mb-3" />
                        <span className="text-xs font-black uppercase tracking-widest">Gerar Backup JSON</span>
                        <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Baixar progresso total</span>
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-200 text-slate-900 rounded-[2rem] hover:bg-slate-50 transition-all group shadow-sm"
                    >
                        <Upload size={32} className="text-blue-500 group-hover:scale-110 transition-transform mb-3" />
                        <span className="text-xs font-black uppercase tracking-widest">Restaurar do Arquivo</span>
                        <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Carregar dados externos</span>
                    </button>
                    <button 
                        onClick={() => window.location.reload()}
                        className="md:col-span-2 flex items-center justify-center gap-3 p-5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-black text-[10px] uppercase tracking-[0.3em]"
                    >
                        <RefreshCw size={14} /> Sincronizar Interface
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
