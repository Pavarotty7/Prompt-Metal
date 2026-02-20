
import React, { useState } from 'react';
import { Project, BudgetTask, TaskStatus } from '../types';
import { calculateTotalProgress } from '../services/budgetService';
import { 
  CheckCircle2, 
  Clock, 
  Activity, 
  ChevronRight, 
  BarChart3,
  ListChecks,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Save
} from 'lucide-react';

interface BudgetProgressManagerProps {
  project: Project;
  onUpdateTasks: (tasks: BudgetTask[], totalProgress: number) => void;
  isAdmin?: boolean;
}

const BudgetProgressManager: React.FC<BudgetProgressManagerProps> = ({ project, onUpdateTasks, isAdmin }) => {
  const tasks = project.tarefas || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BudgetTask | null>(null);
  const [form, setForm] = useState({ nome: '', percentualTotal: '' });

  const handleTaskProgressChange = (taskId: string, newValue: number) => {
    if (!isAdmin) return;

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        let status: TaskStatus = t.status;
        if (newValue === 100) status = 'Finalizada';
        else if (newValue > 0) status = 'Em Execução';
        else if (newValue === 0 && (status === 'Em Execução' || status === 'Finalizada')) status = 'Preparação';
        
        return { ...t, percentualConcluido: newValue, status };
      }
      return t;
    });

    const newTotalProgress = calculateTotalProgress(updatedTasks);
    onUpdateTasks(updatedTasks, newTotalProgress);
  };

  const handleStatusToggle = (taskId: string) => {
    if (!isAdmin) return;
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId && t.percentualConcluido === 0) {
        const nextStatus: TaskStatus = t.status === 'Planeamento' ? 'Preparação' : 'Planeamento';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    onUpdateTasks(updatedTasks, calculateTotalProgress(updatedTasks));
  };

  const handleOpenModal = (task?: BudgetTask) => {
    if (task) {
      setEditingTask(task);
      setForm({ nome: task.nome, percentualTotal: task.percentualTotal.toString() });
    } else {
      setEditingTask(null);
      setForm({ nome: '', percentualTotal: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    let updatedTasks = [...tasks];
    const weight = parseFloat(form.percentualTotal) || 0;

    if (editingTask) {
      updatedTasks = updatedTasks.map(t => 
        t.id === editingTask.id ? { ...t, nome: form.nome, percentualTotal: weight } : t
      );
    } else {
      const newTask: BudgetTask = {
        id: Math.random().toString(36).substr(2, 9),
        nome: form.nome,
        percentualTotal: weight,
        percentualConcluido: 0,
        status: 'Planeamento'
      };
      updatedTasks.unshift(newTask);
    }

    const newTotalProgress = calculateTotalProgress(updatedTasks);
    onUpdateTasks(updatedTasks, newTotalProgress);
    setIsModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Confirmar exclusão desta etapa?")) return;

    const updatedTasks = tasks.filter(t => t.id !== id);
    const newTotalProgress = calculateTotalProgress(updatedTasks);
    onUpdateTasks(updatedTasks, newTotalProgress);
  };

  const handleRedistributeWeights = () => {
    if (!isAdmin || tasks.length === 0) return;
    if (!confirm("Deseja redistribuir os pesos igualmente entre todas as tarefas?")) return;

    const individualWeight = Number((100 / tasks.length).toFixed(2));
    const updatedTasks = tasks.map(t => ({ ...t, percentualTotal: individualWeight }));
    
    const newTotalProgress = calculateTotalProgress(updatedTasks);
    onUpdateTasks(updatedTasks, newTotalProgress);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Finalizada': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'Em Execução': return <Activity className="text-blue-500" size={18} />;
      case 'Preparação': return <Clock className="text-amber-500" size={18} />;
      default: return <Clock className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BarChart3 size={80} />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Progresso da Planilha Orçamentária</p>
          <div className="flex items-end gap-4">
            <h3 className="text-5xl font-black">{project.progress}%</h3>
            <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Finalizado Total</p>
          </div>
          <div className="mt-6 h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ListChecks size={18} /> Detalhamento de Etapas Ponderadas
            </h4>
            <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-3 py-1 rounded-full uppercase">
              {tasks.length} Itens
            </span>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={handleRedistributeWeights}
                className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Redistribuir Pesos
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Plus size={14} className="text-amber-500" /> Adicionar Etapa
              </button>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-slate-50 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-2xl transition-colors ${task.status === 'Finalizada' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">{task.nome}</h5>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(task)} className="p-1 text-slate-400 hover:text-indigo-600"><Pencil size={12}/></button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={12}/></button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Peso: {task.percentualTotal}%</span>
                      <button 
                        disabled={!isAdmin || task.percentualConcluido > 0}
                        onClick={() => handleStatusToggle(task.id)}
                        className={`text-[9px] font-black uppercase tracking-widest transition-all ${
                          task.status === 'Finalizada' ? 'text-emerald-600' : 
                          task.status === 'Em Execução' ? 'text-blue-600' : 
                          task.status === 'Preparação' ? 'text-amber-600' : 'text-slate-400'
                        } ${task.percentualConcluido === 0 && isAdmin ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
                      >
                        {task.status}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 min-w-[250px]">
                  <div className="flex justify-between w-full text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">
                    <span>Execução desta etapa</span>
                    <span className="text-slate-900">{task.percentualConcluido}%</span>
                  </div>
                  <div className="w-full relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`absolute h-full rounded-full transition-all duration-500 ${
                        task.status === 'Finalizada' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${task.percentualConcluido}%` }}
                    />
                    {isAdmin && (
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={task.percentualConcluido}
                        onChange={(e) => handleTaskProgressChange(task.id, parseInt(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    )}
                  </div>
                  <div className="flex justify-between w-full mt-1">
                    <button 
                      onClick={() => handleTaskProgressChange(task.id, 0)}
                      className="text-[8px] font-black text-slate-400 uppercase hover:text-slate-900"
                    >
                      Zerar
                    </button>
                    <button 
                      onClick={() => handleTaskProgressChange(task.id, 100)}
                      className="text-[8px] font-black text-slate-400 uppercase hover:text-emerald-600"
                    >
                      Finalizar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">
              <AlertCircle size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-black uppercase tracking-widest">Nenhuma tarefa orçamentária vinculada.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADICIONAR/EDITAR ETAPA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-white/10">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                {editingTask ? <Pencil size={20} className="text-amber-500" /> : <Plus size={20} className="text-amber-500" />}
                {editingTask ? 'Editar Etapa' : 'Nova Etapa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveTask} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Nome da Etapa</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900" 
                  value={form.nome} 
                  onChange={e => setForm({...form, nome: e.target.value})} 
                  placeholder="Ex: Alvenaria de Elevação" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Peso na Obra (%)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900" 
                  value={form.percentualTotal} 
                  onChange={e => setForm({...form, percentualTotal: e.target.value})} 
                  placeholder="Ex: 15.5" 
                />
                <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest">O peso define quanto esta etapa contribui para o progresso total da obra.</p>
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all active:scale-95">
                  <Save size={18} className="text-amber-500" /> {editingTask ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetProgressManager;
