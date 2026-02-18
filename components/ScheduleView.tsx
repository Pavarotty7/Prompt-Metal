
import React, { useState, useMemo } from 'react';
import { ScheduleTask, Project, SubTask, UserRole } from '../types';
import { 
  CalendarClock, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  GripVertical,
  CalendarDays,
  ListTodo,
  LayoutGrid,
  Activity,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  User,
  Layers
} from 'lucide-react';

interface ScheduleViewProps {
  tasks: ScheduleTask[];
  projects: Project[];
  onAddTask: (task: ScheduleTask) => void;
  onUpdateTask: (task: ScheduleTask) => void;
  userRole?: UserRole;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ tasks, projects, onAddTask, onUpdateTask, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const isAdmin = userRole === 'admin';
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    responsible: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    priority: 'Média' as 'Alta' | 'Média' | 'Baixa',
    progress: 0,
    hasSubtasks: false,
    subtasks: [] as { title: string, responsible: string, progress: number }[]
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.responsible.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const avgProgress = tasks.length > 0 
      ? tasks.reduce((acc, curr) => acc + curr.progress, 0) / tasks.length 
      : 0;

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.progress === 0).length,
      executing: tasks.filter(t => t.progress > 0 && t.progress < 100).length,
      completed: tasks.filter(t => t.progress === 100).length,
      today: tasks.filter(t => t.endDate === today).length,
      average: avgProgress
    };
  }, [tasks]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const subTasksToSave: SubTask[] = formData.hasSubtasks ? formData.subtasks.map(st => ({
      id: Math.random().toString(36).substr(2, 9),
      ...st
    })) : [];

    const initialProgress = subTasksToSave.length > 0 
      ? subTasksToSave.reduce((acc, curr) => acc + curr.progress, 0) / subTasksToSave.length
      : formData.progress;

    const newTask: ScheduleTask = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      projectId: formData.projectId || undefined,
      responsible: formData.responsible,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: initialProgress === 100 ? 'Concluído' : initialProgress > 0 ? 'Em Execução' : 'Pendente',
      priority: formData.priority,
      progress: initialProgress,
      subTasks: subTasksToSave.length > 0 ? subTasksToSave : undefined
    };

    onAddTask(newTask);
    setIsModalOpen(false);
    setFormData({
      title: '', projectId: '', responsible: '', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date().toISOString().split('T')[0], 
      priority: 'Média',
      progress: 0,
      hasSubtasks: false,
      subtasks: []
    });
  };

  const handleUpdateProgress = (task: ScheduleTask, newProgress: number) => {
    if (!isAdmin) return;
    const updatedTask: ScheduleTask = {
      ...task,
      progress: newProgress,
      status: newProgress === 100 ? 'Concluído' : newProgress > 0 ? 'Em Execução' : 'Pendente'
    };
    onUpdateTask(updatedTask);
  };

  const handleUpdateSubTaskProgress = (task: ScheduleTask, subTaskId: string, newProgress: number) => {
    if (!isAdmin || !task.subTasks) return;
    
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, progress: newProgress } : st
    );
    
    const newMainProgress = updatedSubTasks.reduce((acc, curr) => acc + curr.progress, 0) / updatedSubTasks.length;
    
    const updatedTask: ScheduleTask = {
      ...task,
      subTasks: updatedSubTasks,
      progress: newMainProgress,
      status: newMainProgress === 100 ? 'Concluído' : newMainProgress > 0 ? 'Em Execução' : 'Pendente'
    };
    
    onUpdateTask(updatedTask);
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newSet = new Set(expandedTasks);
    if (newSet.has(taskId)) newSet.delete(taskId);
    else newSet.add(taskId);
    setExpandedTasks(newSet);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Em Execução': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Atrasado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-black uppercase tracking-tighter">Cronograma Master</h2>
          <p className="text-slate-500 font-medium">Gestão hierárquica com sub-barras de detalhamento de mão de obra</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-200 p-1 rounded-xl">
             <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><ListTodo size={14} /> Lista</button>
             <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><LayoutGrid size={14} /> Timeline</button>
          </div>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2">
                <Plus size={18} /> Nova Tarefa
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><BarChart3 size={48} /></div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><Target size={24} /></div>
            <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Média de Execução</p><h3 className="text-3xl font-black text-slate-900 leading-none">{stats.average.toFixed(1)}%</h3></div>
         </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar por tarefa..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-black focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarefa / Profissional</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase">Obra</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase text-center w-64">Progresso Físico</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                    {isAdmin && <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase text-center">Ações</th>}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const isExpanded = expandedTasks.has(task.id);
                    const hasSubtasks = task.subTasks && task.subTasks.length > 0;

                    return (
                      <React.Fragment key={task.id}>
                        <tr onClick={() => hasSubtasks && toggleTaskExpansion(task.id)} className={`hover:bg-slate-50/80 transition-all group ${hasSubtasks ? 'cursor-pointer' : ''}`}>
                           <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                 {hasSubtasks ? (isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />) : <div className="w-4 h-4" />}
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{task.title}</p>
                              </div>
                           </td>
                           <td className="py-4 px-6"><span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">{project?.name || 'Geral'}</span></td>
                           <td className="py-4 px-6">
                              <div className="space-y-1.5">
                                 <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest"><span>Avanço</span><span className="text-indigo-600">{task.progress.toFixed(0)}%</span></div>
                                 <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`absolute h-full rounded-full transition-all duration-500 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${task.progress}%` }} />
                                 </div>
                                 {isAdmin && !hasSubtasks && (
                                     <input type="range" min="0" max="100" value={task.progress} onClick={e => e.stopPropagation()} onChange={(e) => handleUpdateProgress(task, parseInt(e.target.value))} className="w-full h-1 bg-transparent appearance-none cursor-pointer accent-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                 )}
                              </div>
                           </td>
                           <td className="py-4 px-6 text-center"><span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${getStatusColor(task.status)}`}>{task.status}</span></td>
                           {isAdmin && <td className="py-4 px-6 text-center"><button className="text-slate-300 hover:text-indigo-600 p-2"><MoreVertical size={16} /></button></td>}
                        </tr>
                        {isExpanded && task.subTasks?.map(sub => (
                           <tr key={sub.id} className="bg-indigo-50/30 animate-fade-in border-l-4 border-indigo-500">
                              <td className="py-3 px-6 pl-14"><p className="text-xs font-bold text-slate-700 uppercase">{sub.title}</p></td>
                              <td colSpan={1}></td>
                              <td className="py-3 px-6">
                                 <div className="space-y-1">
                                    <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={`absolute h-full rounded-full ${sub.progress === 100 ? 'bg-emerald-400' : 'bg-indigo-400'}`} style={{ width: `${sub.progress}%` }} /></div>
                                    {isAdmin && <input type="range" min="0" max="100" value={sub.progress} onClick={e => e.stopPropagation()} onChange={(e) => handleUpdateSubTaskProgress(task, sub.id, parseInt(e.target.value))} className="w-full h-1 bg-transparent appearance-none cursor-pointer accent-indigo-500 opacity-60 hover:opacity-100" />}
                                 </div>
                              </td>
                              <td colSpan={2}></td>
                           </tr>
                        ))}
                      </React.Fragment>
                    );
                 })}
              </tbody>
           </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
           <div className="space-y-8">
              {filteredTasks.map(task => {
                  const duration = calculateDuration(task.startDate, task.endDate);
                  const width = Math.min(duration * 5, 100); 
                  return (
                    <div key={task.id} className="space-y-2">
                       <div className="flex justify-between items-end"><span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{task.title}</span><span className="text-[9px] font-black text-indigo-600">{task.progress.toFixed(0)}%</span></div>
                       <div className="h-6 bg-slate-50 rounded-lg relative overflow-hidden border border-slate-100">
                          <div className={`h-full absolute left-0 top-0 transition-all duration-1000 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${(width * task.progress) / 100}%` }} />
                       </div>
                    </div>
                  );
              })}
           </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
