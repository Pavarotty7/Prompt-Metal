
import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, UserRole, Transaction, Employee, BudgetTask } from '../types';
import { distributeWeights } from '../services/budgetService';
import { CONSTRUCTION_STAGES, ALL_DEFAULT_TASKS } from '../constants';
import { 
  Calendar as CalendarIcon, 
  User, 
  MapPin, 
  Activity, 
  DollarSign, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Plus,
  X,
  HardHat,
  Save,
  Settings,
  Target,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Layers,
  Maximize2,
  FileEdit,
  Trash2,
  Tag,
  CreditCard,
  ClipboardList,
  ListChecks,
  FileWarning
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  transactions?: Transaction[];
  employees?: Employee[];
  onAddProject?: (project: Project) => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onSelectProject: (projectId: string) => void;
  userRole?: UserRole;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  projects, 
  transactions = [], 
  employees = [],
  onAddProject, 
  onUpdateProject,
  onDeleteProject,
  onSelectProject, 
  userRole 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const isAdmin = userRole === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    address: '',
    responsible: '',
    startDate: '',
    endDate: '',
    budget: '',
    category: 'Industrial' as Project['category'],
    priority: 'Normal' as Project['priority'],
    areaM2: '',
    description: ''
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.client.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTaskSelection = (task: string) => {
    setSelectedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const handleEditProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setFormData({
      name: project.name,
      client: project.client,
      address: project.address,
      responsible: project.responsible,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget.toString(),
      category: project.category,
      priority: project.priority,
      areaM2: project.areaM2?.toString() || '',
      description: project.description || ''
    });
    setSelectedTasks(project.tarefas?.map(t => t.nome) || []);
    setIsFormOpen(true);
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta obra? Todos os dados vinculados serão perdidos.")) {
      onDeleteProject?.(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      alert("A data de término não pode ser anterior à data de início.");
      return;
    }

    // Distribui os pesos automaticamente para as tarefas selecionadas
    const distributedTasks = distributeWeights(selectedTasks);

    if (editingProjectId) {
      if (onUpdateProject) {
        const existingProject = projects.find(p => p.id === editingProjectId);
        if (existingProject) {
          const updatedProject: Project = {
            ...existingProject,
            name: formData.name,
            client: formData.client,
            address: formData.address,
            responsible: formData.responsible,
            startDate: formData.startDate,
            endDate: formData.endDate,
            budget: parseFloat(formData.budget) || 0,
            tarefas: distributedTasks,
            category: formData.category,
            priority: formData.priority,
            areaM2: parseFloat(formData.areaM2) || undefined,
            description: formData.description,
          };
          onUpdateProject(updatedProject);
        }
      }
    } else if (onAddProject) {
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        client: formData.client,
        address: formData.address,
        responsible: formData.responsible,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: ProjectStatus.PLANNED,
        budget: parseFloat(formData.budget) || 0,
        spent: 0,
        progress: 0,
        tarefas: distributedTasks,
        category: formData.category,
        priority: formData.priority,
        areaM2: parseFloat(formData.areaM2) || undefined,
        description: formData.description,
        dataCriacao: new Date().toISOString()
      };
      
      onAddProject(newProject);
    }

    setIsFormOpen(false);
    setEditingProjectId(null);
    setSelectedTasks(ALL_DEFAULT_TASKS.filter(task => 
      !CONSTRUCTION_STAGES.find(s => s.category === 'Preparação e Planeamento')?.tasks.includes(task)
    ));
    setFormData({
      name: '', client: '', address: '', responsible: '', startDate: '', endDate: '', budget: '',
      category: 'Industrial', priority: 'Normal', areaM2: '', description: ''
    });
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const styles = {
      [ProjectStatus.PLANNED]: 'bg-slate-100 text-slate-700 border-slate-200',
      [ProjectStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
      [ProjectStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      [ProjectStatus.DELAYED]: 'bg-red-100 text-red-800 border-red-200',
      [ProjectStatus.WAITING_DOCUMENT]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    
    const icons = {
      [ProjectStatus.PLANNED]: <Clock size={12} />,
      [ProjectStatus.IN_PROGRESS]: <Activity size={12} />,
      [ProjectStatus.COMPLETED]: <CheckCircle2 size={12} />,
      [ProjectStatus.DELAYED]: <AlertCircle size={12} />,
      [ProjectStatus.WAITING_DOCUMENT]: <FileWarning size={12} />,
    };

    return (
      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1 ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];
    const monthName = currentDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const projectEvents = projects.filter(p => p.startDate === dateString || p.endDate === dateString);
      const pendingPayments = transactions.filter(t => t.date === dateString && t.type === 'expense' && t.status === 'Pendente');
      const isDay28 = d === 28;

      days.push(
        <div key={d} className="h-32 bg-white border border-slate-100 p-2 overflow-y-auto hover:bg-slate-50 transition-colors group relative">
          <div className="flex justify-between items-start">
             {isDay28 && (
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" title="Fechamento/Vencimento"></div>
                </div>
             )}
            <span className={`text-xs font-black ${
              new Date().toISOString().split('T')[0] === dateString 
                ? 'bg-amber-500 text-white w-6 h-6 inline-flex items-center justify-center rounded-full shadow-md' 
                : 'text-slate-600'
            }`}>
              {d}
            </span>
          </div>
          
          <div className="mt-1 space-y-1">
            {projectEvents.map(project => {
              const isStart = project.startDate === dateString;
              return (
                <div 
                  key={`proj-${project.id}-${isStart ? 's' : 'e'}`} 
                  onClick={() => onSelectProject(project.id)}
                  className={`text-[7px] p-1 rounded border-l-2 font-black uppercase truncate cursor-pointer hover:scale-105 transition-all ${
                    isStart ? 'bg-blue-50 border-blue-600 text-blue-900' : 'bg-rose-50 border-rose-600 text-rose-900'
                  }`}
                >
                  <HardHat size={8} className="inline mr-1" />
                  {isStart ? 'INÍCIO' : 'FIM'}: {project.name}
                </div>
              );
            })}

            {pendingPayments.map(t => (
              <div key={`pay-${t.id}`} className="text-[7px] p-1 rounded border-l-2 border-emerald-600 bg-emerald-50 text-emerald-900 font-black uppercase truncate">
                <DollarSign size={8} className="inline mr-1" />
                PGTO: {t.description}
              </div>
            ))}

            {isDay28 && (
               <div className="space-y-1">
                  <div className="text-[7px] p-1 rounded border-l-2 border-orange-600 bg-orange-50 text-orange-900 font-black uppercase truncate">
                    <CreditCard size={8} className="inline mr-1" />
                    Venc. Cartão
                  </div>
                  <div className="text-[7px] p-1 rounded border-l-2 border-indigo-600 bg-indigo-50 text-indigo-900 font-black uppercase truncate">
                    <ClipboardList size={8} className="inline mr-1" />
                    Fech. Folha
                  </div>
               </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-700"><ChevronLeft size={24} /></button>
          <div className="text-center">
             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{monthName}</h3>
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Agenda Integrada PromptMetal</p>
          </div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-700"><ChevronRight size={24} /></button>
        </div>
        <div className="grid grid-cols-7 text-center bg-slate-100 border-b border-slate-200">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">{days}</div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-600 rounded-full"></div><span className="text-[8px] font-black uppercase text-slate-600">Início Obra</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-rose-600 rounded-full"></div><span className="text-[8px] font-black uppercase text-slate-600">Fim Obra</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-600 rounded-full"></div><span className="text-[8px] font-black uppercase text-slate-600">Pagamentos</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-orange-600 rounded-full"></div><span className="text-[8px] font-black uppercase text-slate-600">Dia 28 (Alertas)</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Obras & Produção</h2>
          <p className="text-slate-600 font-medium italic">Gestão física e acompanhamento de cronogramas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List size={14} /> Lista
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <CalendarIcon size={14} /> Calendário
            </button>
          </div>
          {isAdmin && (
            <button 
                onClick={() => {
                  setEditingProjectId(null);
                  setFormData({
                    name: '', client: '', address: '', responsible: '', startDate: '', endDate: '', budget: '',
                    category: 'Industrial', priority: 'Normal', areaM2: '', description: ''
                  });
                  setSelectedTasks(ALL_DEFAULT_TASKS.filter(task => 
                    !CONSTRUCTION_STAGES.find(s => s.category === 'Preparação e Planeamento')?.tasks.includes(task)
                  ));
                  setIsFormOpen(true);
                }}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-xl transition-all flex items-center gap-2 border border-amber-500/20"
            >
                <Plus size={18} className="text-amber-500" /> Nova Obra
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-3 text-slate-600" size={18} />
             <input 
                type="text" 
                placeholder="Buscar por nome da obra ou cliente..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <Filter size={18} className="text-slate-600" />
             <select 
                className="flex-1 md:flex-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none text-slate-800"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
             >
                <option value="all">Todos os Status</option>
                <option value={ProjectStatus.PLANNED}>Planejada</option>
                <option value={ProjectStatus.IN_PROGRESS}>Em Andamento</option>
                <option value={ProjectStatus.COMPLETED}>Concluída</option>
                <option value={ProjectStatus.DELAYED}>Atrasada</option>
                <option value={ProjectStatus.WAITING_DOCUMENT}>Aguardando Documento</option>
             </select>
          </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
           {filteredProjects.map(project => (
             <div 
                key={project.id} 
                onClick={() => onSelectProject(project.id)}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 hover:shadow-2xl hover:border-slate-800 transition-all cursor-pointer group flex flex-col justify-between min-h-[300px]"
             >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:bg-amber-500 transition-colors">
                      <HardHat size={28} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          {isAdmin && (
                            <>
                              <button 
                                onClick={(e) => handleEditProject(e, project)}
                                className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-200"
                                title="Editar Obra"
                              >
                                <FileEdit size={16} />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => handleDeleteProject(e, project.id)}
                                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                                title="Excluir Obra"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          {getStatusBadge(project.status)}
                        </div>
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded text-[8px] font-black uppercase tracking-widest">{project.category}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2 leading-none">{project.name}</h3>
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <User size={12} className="text-slate-900"/> {project.client}
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
                       <span>Progresso Real</span>
                       <span className="text-slate-900">{project.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                       <div 
                          className={`h-full rounded-full transition-all duration-1000 ${project.progress === 100 ? 'bg-emerald-500' : 'bg-slate-900'}`} 
                          style={{ width: `${project.progress}%` }}
                        />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Término Previsto</span>
                       <span className="text-[10px] font-black text-slate-900 uppercase">{new Date(project.endDate).toLocaleDateString('pt-PT')}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all border border-slate-100">
                       <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
             </div>
           ))}
        </div>
      ) : renderCalendar()}

      {isFormOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 animate-scale-in flex flex-col max-h-[95vh]">
            <div className="bg-slate-900 px-10 py-8 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="font-black text-2xl flex items-center gap-4 uppercase tracking-tighter">
                    <HardHat size={32} className="text-amber-500" /> {editingProjectId ? 'Editar Obra' : 'Cadastrar Nova Obra'}
                </h3>
              </div>
              <button onClick={() => { setIsFormOpen(false); setEditingProjectId(null); }} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-amber-500 pl-3 flex items-center gap-2">
                    <Layers size={14}/> Identificação Primária
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Nome do Projeto</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 transition-all" placeholder="Ex: Reforma Burger King Lisboa" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Categoria da Obra</label>
                        <select name="category" required value={formData.category} onChange={handleInputChange} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:border-slate-900 transition-all appearance-none cursor-pointer">
                            <option value="Metalomecânica">Metalomecânica</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Residencial">Residencial</option>
                            <option value="Civil">Civil / Geral</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Cliente / Franquia</label>
                        <input type="text" name="client" required value={formData.client} onChange={handleInputChange} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:border-slate-900 transition-all" placeholder="Razão Social ou Nome do Franqueado" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Área Estimada (m²)</label>
                        <input type="number" name="areaM2" value={formData.areaM2} onChange={handleInputChange} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:border-slate-900" placeholder="0" />
                    </div>
                </div>
              </div>

              {/* SEÇÃO: PLANILHA ORÇAMENTÁRIA (SELEÇÃO DE TAREFAS) */}
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-indigo-500 pl-3 flex items-center gap-2">
                      <ListChecks size={14}/> Composição da Planilha Orçamentária
                  </h4>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setSelectedTasks(ALL_DEFAULT_TASKS)}
                      className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      Selecionar Todas
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedTasks([])}
                      className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Selecione as etapas que compõem esta obra. O peso de 100% será distribuído proporcionalmente entre as selecionadas.</p>
                
                <div className="space-y-10">
                  {CONSTRUCTION_STAGES.map(stage => (
                    <div key={stage.category} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-100"></div>
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stage.category}</h5>
                        <div className="h-px flex-1 bg-slate-100"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stage.tasks.map(task => (
                          <button
                            key={task}
                            type="button"
                            onClick={() => toggleTaskSelection(task)}
                            className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-tight text-left transition-all flex items-center justify-between gap-3 ${
                              selectedTasks.includes(task) 
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm' 
                                : 'bg-white border-slate-100 text-slate-400 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                            }`}
                          >
                            <span className="flex-1">{task}</span>
                            {selectedTasks.includes(task) && <CheckCircle2 size={14} className="shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl text-center sticky bottom-4 shadow-2xl border border-white/10 z-10">
                   <p className="text-white text-[11px] font-black uppercase tracking-widest">
                     Distribuição Automática: {selectedTasks.length > 0 ? (100 / selectedTasks.length).toFixed(2) : 0}% por cada uma das {selectedTasks.length} tarefas selecionadas.
                   </p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-emerald-500 pl-3 flex items-center gap-2">
                    <CalendarIcon size={14}/> Cronograma & Financeiro
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Data Início</label>
                        <input type="date" name="startDate" required value={formData.startDate} onChange={handleInputChange} className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Previsão Término</label>
                        <input type="date" name="endDate" required value={formData.endDate} onChange={handleInputChange} className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Orçamento Previsto (€)</label>
                        <input type="number" name="budget" required value={formData.budget} onChange={handleInputChange} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-emerald-800" placeholder="0.00" />
                    </div>
                </div>
              </div>
              
              <div className="pt-10 flex flex-col md:flex-row justify-end gap-4 border-t border-slate-100">
                <button type="button" onClick={() => { setIsFormOpen(false); setEditingProjectId(null); }} className="px-10 py-5 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" disabled={selectedTasks.length === 0} className="bg-slate-900 text-white px-14 py-5 rounded-[1.5rem] font-black shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm border-2 border-emerald-500/30 disabled:opacity-50">
                  <Save size={22} className="text-amber-500"/> {editingProjectId ? 'Salvar Alterações' : 'Finalizar Cadastro de Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
