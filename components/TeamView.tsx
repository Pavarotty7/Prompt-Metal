
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  User, 
  Plus, 
  Trash2, 
  UserPlus,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Crown,
  ArrowDown,
  AlertTriangle,
  X,
  Search,
  Building2,
  Settings2,
  Edit2,
  Save,
  UserCheck,
  Coins,
  Layers,
  CheckCircle2,
  Target,
  FileText,
  CreditCard,
  Banknote,
  MapPin,
  Clock
} from 'lucide-react';
import { UserRole, Employee, Project, TimesheetRecord } from '../types';

interface Professional {
  id: string;
  name: string;
  role: string;
  description?: string;
}

interface Department {
  id: string;
  title: string;
  responsible: string;
  professionals: Professional[];
}

interface CEO {
  id: string;
  name: string;
  role: string;
  description?: string;
}

const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-adm',
    title: "Administrativo & RH",
    responsible: "Juliana Costa",
    professionals: []
  },
  {
    id: 'dept-fin',
    title: "Financeiro & Compras",
    responsible: "Ana Paula",
    professionals: []
  },
  {
    id: 'dept-op',
    title: "Operação & Logística",
    responsible: "Ricardo Silva",
    professionals: []
  }
];

const INITIAL_CEOS: CEO[] = [
  { id: 'ceo1', name: "Rodrigo", role: "Diretor Executivo (CEO)", description: "Planejamento estratégico master, expansão da marca e relação com grandes contas corporativas." },
  { id: 'ceo2', name: "Diego Almeida", role: "Diretor de Operações (COO)", description: "Gestão da eficiência produtiva, suprimentos estratégicos e conformidade técnica da frota." }
];

const ROLES_LIST = [
  'Administrativo',
  'RH',
  'Contabilidade',
  'Diretor Financeiro',
  'Secretária',
  'Auxiliar de Escritório',
  'Encarregado', 
  'Mestre de Obras', 
  'Pedreiro', 
  'Servente', 
  'Pladur', 
  'Eletricista', 
  'Carpinteiro', 
  'Dobrador de Ferro', 
  'Canalizador', 
  'Pintor', 
  'Gruista'
];

interface TeamViewProps {
  userRole?: UserRole;
  employees?: Employee[];
  projects?: Project[];
  timesheetRecords?: TimesheetRecord[];
  onAddEmployee?: (employee: Employee) => void;
  onUpdateEmployee?: (employee: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
}

const TeamView: React.FC<TeamViewProps> = ({ 
  userRole, 
  employees = [], 
  projects = [],
  timesheetRecords = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}) => {
  const [activeTab, setActiveTab] = useState<'organogram' | 'operational'>('organogram');
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [ceos, setCeos] = useState<CEO[]>(INITIAL_CEOS);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCeoModalOpen, setIsCeoModalOpen] = useState(false);
  const [isProfessionalModalOpen, setIsProfessionalModalOpen] = useState<{deptId: string} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{type: 'dept' | 'pro' | 'emp' | 'ceo', id: string, parentId?: string} | null>(null);
  
  const isAdmin = userRole === 'admin';

  const currentCycleRange = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    let start, end;
    if (day >= 25) {
      start = new Date(year, month, 25);
      end = new Date(year, month + 1, 24);
    } else {
      start = new Date(year, month - 1, 25);
      end = new Date(year, month, 24);
    }
    return { start, end };
  }, []);

  const getEmployeeMonthlyTotal = (employeeName: string) => {
    if (!timesheetRecords) return 0;
    return timesheetRecords
      .filter(r => {
        const recordDate = new Date(r.date);
        const d = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const s = new Date(currentCycleRange.start.getFullYear(), currentCycleRange.start.getMonth(), currentCycleRange.start.getDate());
        const e = new Date(currentCycleRange.end.getFullYear(), currentCycleRange.end.getMonth(), currentCycleRange.end.getDate());
        return r.employeeName === employeeName && d >= s && d <= e;
      })
      .reduce((sum, r) => sum + r.totalPay, 0);
  };

  const [empForm, setEmpForm] = useState({ 
    id: '',
    name: '', 
    nif: '',
    role: '', 
    type: 'CLT' as Employee['type'], 
    category: 'Operational' as Employee['category'], 
    allocation: '', // Valor do select (id|type)
    baseRate: '',
    monthlySalary: ''
  });
  
  const [deptForm, setDeptForm] = useState({ id: '', title: '', responsible: '' });
  const [ceoForm, setCeoForm] = useState({ id: '', name: '', role: '', description: '' });
  const [proForm, setProForm] = useState({ name: '', role: '', description: '' });

  const filteredEmployees = useMemo(() => employees
    .filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.nif?.includes(searchTerm)
    )
    .sort((a, b) => (b.monthlySalary || 0) - (a.monthlySalary || 0)), [employees, searchTerm]);
  
  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;
    return departments.filter(d => 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.responsible.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  const toggleDept = (id: string) => {
    const newSet = new Set(expandedDepts);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedDepts(newSet);
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !onAddEmployee) return;

    // Destrinchar valor do select: "ID|TYPE"
    const [allocId, allocType] = empForm.allocation.split('|');

    if (empForm.id) {
      // Edit existing employee
      const updatedEmp: Employee = {
        id: empForm.id,
        name: empForm.name,
        nif: empForm.nif,
        role: empForm.role || 'Colaborador',
        type: empForm.type,
        category: empForm.category,
        allocationId: allocId || '',
        allocationType: (allocType as any) || 'department',
        baseRate: parseFloat(empForm.baseRate) || 0,
        monthlySalary: parseFloat(empForm.monthlySalary) || 0
      };
      // We need onUpdateEmployee prop
      if (onUpdateEmployee) onUpdateEmployee(updatedEmp);
    } else {
      const newEmp: Employee = { 
        id: Math.random().toString(36).substr(2, 9), 
        name: empForm.name, 
        nif: empForm.nif,
        role: empForm.role || 'Colaborador', 
        type: empForm.type, 
        category: empForm.category, 
        allocationId: allocId || '', 
        allocationType: (allocType as any) || 'department',
        baseRate: parseFloat(empForm.baseRate) || 0,
        monthlySalary: parseFloat(empForm.monthlySalary) || 0
      };
      onAddEmployee(newEmp);
    }
    
    setIsEmployeeModalOpen(false);
    setEmpForm({ id: '', name: '', nif: '', role: '', type: 'CLT', category: 'Operational', allocation: '', baseRate: '', monthlySalary: '' });
  };

  const getAllocationLabel = (emp: Employee) => {
    if (emp.allocationType === 'project') {
      return projects.find(p => p.id === emp.allocationId)?.name || 'Obra Não Identificada';
    }
    return departments.find(d => d.id === emp.allocationId)?.title || 'Setor Não Identificado';
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (deptForm.id) {
      setDepartments(departments.map(d => d.id === deptForm.id ? { ...d, title: deptForm.title, responsible: deptForm.responsible } : d));
    } else {
      setDepartments([...departments, { id: 'dept-' + Math.random().toString(36).substr(2, 5), title: deptForm.title, responsible: deptForm.responsible, professionals: [] }]);
    }
    setIsDeptModalOpen(false);
    setDeptForm({ id: '', title: '', responsible: '' });
  };

  const handleAddProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfessionalModalOpen) return;
    setDepartments(departments.map(d => d.id === isProfessionalModalOpen.deptId ? { ...d, professionals: [...d.professionals, { id: Math.random().toString(36).substr(2, 9), ...proForm }] } : d));
    setIsProfessionalModalOpen(null);
    setProForm({ name: '', role: '', description: '' });
  };

  const handleSaveCeo = (e: React.FormEvent) => {
    e.preventDefault();
    if (ceoForm.id) {
      setCeos(ceos.map(c => c.id === ceoForm.id ? { ...c, name: ceoForm.name, role: ceoForm.role, description: ceoForm.description } : c));
    } else {
      setCeos([...ceos, { id: 'ceo-' + Math.random().toString(36).substr(2, 5), name: ceoForm.name, role: ceoForm.role, description: ceoForm.description }]);
    }
    setIsCeoModalOpen(false);
    setCeoForm({ id: '', name: '', role: '', description: '' });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    const { type, id, parentId } = confirmDelete;
    if (type === 'dept') setDepartments(departments.filter(d => d.id !== id));
    else if (type === 'ceo') setCeos(ceos.filter(c => c.id !== id));
    else if (type === 'emp') {
      // We need onDeleteEmployee prop
      if (onDeleteEmployee) onDeleteEmployee(id);
    }
    else if (type === 'pro' && parentId) setDepartments(departments.map(d => d.id === parentId ? { ...d, professionals: d.professionals.filter(p => p.id !== id) } : d));
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestão de Equipe</h2>
          <p className="text-slate-600 font-medium italic">Estrutura administrativa e operacional da franquia</p>
        </div>
        <div className="flex gap-2 bg-slate-200 p-1.5 rounded-2xl border border-slate-300">
             <button onClick={() => { setActiveTab('organogram'); setSearchTerm(''); }} className={`px-6 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'organogram' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Organograma</button>
             <button onClick={() => { setActiveTab('operational'); setSearchTerm(''); }} className={`px-6 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'operational' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Equipe de Campo</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-slate-950" size={18} />
            <input type="text" placeholder={`Buscar por nome, cargo ou NIF...`} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
         </div>
         {activeTab === 'operational' && isAdmin && (
           <button onClick={() => setIsEmployeeModalOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl active:scale-95 transition-all flex items-center gap-3 shrink-0"><UserPlus size={18} className="text-amber-500" /> Cadastrar Colaborador</button>
         )}
      </div>

      {activeTab === 'operational' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
             {filteredEmployees.map(emp => (
               <div key={emp.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 hover:shadow-2xl hover:border-slate-800 transition-all group relative">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-4 bg-slate-100 text-slate-950 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all border border-slate-200 shadow-sm"><User size={32} /></div>
                     <div className="flex flex-col items-end gap-2">
                       <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${emp.type === 'CLT' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-800 border-blue-300'}`}>{emp.type}</span>
                       <div className="text-right">
                         <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Acumulado Ciclo</p>
                         <p className="text-[10px] font-black text-emerald-600 leading-none">€ {getEmployeeMonthlyTotal(emp.name).toLocaleString('pt-PT', {minimumFractionDigits: 2})}</p>
                       </div>
                       {isAdmin && (
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                           <button 
                             onClick={() => {
                               setEmpForm({
                                 id: emp.id,
                                 name: emp.name,
                                 nif: emp.nif || '',
                                 role: emp.role,
                                 type: emp.type,
                                 category: emp.category,
                                 allocation: `${emp.allocationId}|${emp.allocationType}`,
                                 baseRate: emp.baseRate?.toString() || '',
                                 monthlySalary: emp.monthlySalary?.toString() || ''
                               });
                               setIsEmployeeModalOpen(true);
                             }}
                             className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                           >
                             <Edit2 size={14} />
                           </button>
                           <button 
                             onClick={() => setConfirmDelete({ type: 'emp', id: emp.id })}
                             className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       )}
                     </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-1 leading-tight">{emp.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                      <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={12}/> {emp.role}</p>
                      {emp.nif && (
                        <>
                          <span className="text-slate-300">|</span>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1"><FileText size={10}/> NIF: {emp.nif}</p>
                        </>
                      )}
                  </div>
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                     <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
                            {emp.allocationType === 'project' ? <Building2 size={10}/> : <Layers size={10}/>} 
                            Alocação
                        </span>
                        <span className="text-[10px] font-black text-slate-950 uppercase truncate max-w-[150px]">
                            {getAllocationLabel(emp)}
                        </span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1"><Banknote size={10}/> Salário Base</span>
                        <span className="text-[10px] font-black text-emerald-800 uppercase">€ {emp.baseRate?.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span>
                     </div>
                  </div>
               </div>
             ))}
             {filteredEmployees.length === 0 && (
                 <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50">
                    <Users size={64} className="mx-auto text-slate-300 mb-4 opacity-20" />
                    <p className="text-slate-500 font-black uppercase tracking-widest italic">Nenhum colaborador operacional cadastrado.</p>
                 </div>
             )}
        </div>
      ) : (
        <div className="animate-fade-in space-y-12 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
               <div className="bg-slate-900 p-6 rounded-3xl text-white flex items-center gap-4 shadow-xl border border-white/5">
                  <div className="p-3 bg-white/10 rounded-2xl text-amber-500 shadow-inner"><Layers size={24}/></div>
                  <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Setores ADM</p><p className="text-2xl font-black">{departments.length}</p></div>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-300 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-700"><Users size={24}/></div>
                  <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Equipe Total</p><p className="text-2xl font-black text-slate-950">{employees.length}</p></div>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-300 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-700"><Crown size={24}/></div>
                  <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Quadro Diretoria</p><p className="text-2xl font-black text-slate-950">{ceos.length}</p></div>
               </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-slate-900 border-4 border-amber-500 p-8 rounded-[2.5rem] shadow-2xl text-center relative w-full max-w-2xl group">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10"></div>
                  <Crown className="text-amber-500 animate-pulse" size={32} />
                  {isAdmin ? (
                    <button 
                      onClick={() => { setCeoForm({ id: '', name: '', role: '', description: '' }); setIsCeoModalOpen(true); }}
                      className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  ) : <div className="w-10"></div>}
                </div>
                <h3 className="text-white text-[9px] font-black uppercase tracking-[0.4em] mb-6">Diretoria Estratégica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ceos.map((ceo) => (
                    <div key={ceo.id} className="bg-white/5 p-6 rounded-2xl border border-white/10 text-left transition-all hover:bg-white/10 relative group/ceo">
                      {isAdmin && (
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover/ceo:opacity-100 transition-all">
                          <button 
                            onClick={() => { setCeoForm({ id: ceo.id, name: ceo.name, role: ceo.role, description: ceo.description || '' }); setIsCeoModalOpen(true); }}
                            className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => setConfirmDelete({ type: 'ceo', id: ceo.id })}
                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      <p className="text-white font-black uppercase text-base tracking-tight leading-none mb-1">{ceo.name}</p>
                      <p className="text-amber-500 text-[9px] font-black uppercase tracking-widest mb-3">{ceo.role}</p>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed line-clamp-2">{ceo.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-1 h-12 bg-slate-300 mt-4 relative">
                <ArrowDown size={16} className="absolute -bottom-2 -left-[7px] text-slate-400" />
              </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-10">
                {isAdmin && (
                    <div className="flex justify-center">
                        <button onClick={() => { setDeptForm({ id: '', title: '', responsible: '' }); setIsDeptModalOpen(true); }} className="bg-white border-2 border-slate-900 text-slate-900 px-12 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all shadow-xl flex items-center gap-4">
                           <Plus size={24} /> Adicionar Novo Setor
                        </button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {filteredDepartments.map(dept => {
                     const isExpanded = expandedDepts.has(dept.id) || searchTerm !== '';
                     const deptEmployees = employees.filter(e => e.allocationId === dept.id);

                     return (
                       <div key={dept.id} className="bg-white rounded-[2.5rem] border border-slate-300 p-8 shadow-xl hover:shadow-2xl transition-all relative group overflow-hidden">
                          <div className="flex items-center justify-between mb-6">
                            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg"><Layers size={22}/></div>
                            <div className="flex gap-2">
                               {isAdmin && (
                                   <>
                                      <button onClick={() => { setDeptForm({ id: dept.id, title: dept.title, responsible: dept.responsible }); setIsDeptModalOpen(true); }} className="p-2 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl transition-all"><Edit2 size={18}/></button>
                                      <button onClick={() => setConfirmDelete({ type: 'dept', id: dept.id })} className="p-2 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl transition-all"><Trash2 size={18}/></button>
                                   </>
                               )}
                               <button onClick={() => toggleDept(dept.id)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-900 transition-all">{isExpanded ? <ChevronUp size={22}/> : <ChevronDown size={22}/>}</button>
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight leading-tight">{dept.title}</h3>
                          <div className="mt-2 flex items-center gap-2">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Responsável:</span>
                             <span className="text-[10px] text-slate-950 font-black uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{dept.responsible}</span>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-8 pt-8 border-t border-slate-200 animate-slide-in-bottom">
                              <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[9px] font-black text-slate-950 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Profissionais Alocados</h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{deptEmployees.length} pessoas</span>
                                  {isAdmin && (
                                    <button 
                                      onClick={() => {
                                        setEmpForm({
                                          id: '',
                                          name: '',
                                          nif: '',
                                          role: '',
                                          type: 'CLT',
                                          category: 'Administrative',
                                          allocation: `${dept.id}|department`,
                                          baseRate: '',
                                          monthlySalary: ''
                                        });
                                        setIsEmployeeModalOpen(true);
                                      }}
                                      className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-all flex items-center gap-1 text-[8px] font-black uppercase tracking-widest"
                                    >
                                      <Plus size={12} /> Adicionar
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-4">
                                {deptEmployees.length > 0 ? deptEmployees.map(emp => (
                                  <div key={emp.id} className="p-5 bg-slate-50 rounded-2xl group/pro relative border border-slate-200 hover:border-slate-900 hover:bg-white transition-all shadow-sm">
                                    <div className="flex justify-between items-start">
                                      <div><p className="text-sm font-black text-slate-950 uppercase leading-none mb-1">{emp.name}</p><p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">{emp.role}</p></div>
                                      <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[8px] font-black uppercase">{emp.type}</div>
                                        {isAdmin && (
                                          <div className="flex gap-1 opacity-0 group-hover/pro:opacity-100 transition-all">
                                            <button 
                                              onClick={() => {
                                                setEmpForm({
                                                  id: emp.id,
                                                  name: emp.name,
                                                  nif: emp.nif || '',
                                                  role: emp.role,
                                                  type: emp.type,
                                                  category: emp.category,
                                                  allocation: `${emp.allocationId}|${emp.allocationType}`,
                                                  baseRate: emp.baseRate?.toString() || '',
                                                  monthlySalary: emp.monthlySalary?.toString() || ''
                                                });
                                                setIsEmployeeModalOpen(true);
                                              }}
                                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                            <button 
                                              onClick={() => setConfirmDelete({ type: 'emp', id: emp.id })}
                                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )) : (
                                  <p className="text-[10px] text-slate-400 font-bold uppercase italic text-center py-4">Ninguém alocado a este setor.</p>
                                )}
                              </div>
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
            </div>
        </div>
      )}

      {/* MODAL: NOVO COLABORADOR (OPERACIONAL) */}
      {isEmployeeModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-scale-in flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-10 flex justify-between items-center text-white">
                 <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4"><UserPlus size={32} className="text-amber-500" /> {empForm.id ? 'Editar Colaborador' : 'Cadastro Operacional'}</h3>
                 <button onClick={() => setIsEmployeeModalOpen(false)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all"><X size={28} /></button>
              </div>
              <form onSubmit={handleAddEmployeeSubmit} className="p-10 space-y-8 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="col-span-1 md:col-span-2">
                       <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Nome Completo</label>
                       <input required type="text" className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} placeholder="Ex: João da Silva" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">NIF (Identificação Fiscal)</label>
                        <div className="relative">
                            <FileText className="absolute left-6 top-5 text-slate-400" size={20} />
                            <input required type="text" className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none focus:ring-2 focus:ring-slate-900" value={empForm.nif} onChange={e => setEmpForm({...empForm, nif: e.target.value})} placeholder="000 000 000" />
                        </div>
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Função / Cargo</label>
                       <select required className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none cursor-pointer" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})}>
                          <option value="">Selecionar Cargo...</option>
                          {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Vínculo Contratual</label>
                       <select required className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none cursor-pointer" value={empForm.type} onChange={e => setEmpForm({...empForm, type: e.target.value as any})}>
                          <option value="CLT">CLT (Quadro Próprio)</option>
                          <option value="PJ">PJ (Contratado)</option>
                          <option value="Terceiro">Terceiro / Subempreitada</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Salário Base Mensal (€)</label>
                       <div className="relative">
                          <Banknote className="absolute left-6 top-5 text-emerald-600" size={20} />
                          <input required type="number" step="0.01" className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-600" value={empForm.monthlySalary} onChange={e => {
                            const val = e.target.value;
                            const hourly = val ? (parseFloat(val) / 22 / 8).toFixed(2) : '';
                            setEmpForm({...empForm, monthlySalary: val, baseRate: hourly});
                          }} placeholder="0.00" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Valor Hora (€)</label>
                       <div className="relative">
                          <Clock className="absolute left-6 top-5 text-slate-400" size={20} />
                          <input type="number" step="0.01" className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none focus:ring-2 focus:ring-slate-900" value={empForm.baseRate} onChange={e => setEmpForm({...empForm, baseRate: e.target.value})} placeholder="0.00" />
                       </div>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                       <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Alocação (Obra ou Setor)</label>
                       <select required className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none cursor-pointer" value={empForm.allocation} onChange={e => setEmpForm({...empForm, allocation: e.target.value})}>
                          <option value="">Escolher destino de alocação...</option>
                          <optgroup label="Obras em Andamento">
                             {projects.filter(p=>p.status !== 'Concluída').map(p => <option key={p.id} value={`${p.id}|project`}>{p.name} ({p.client})</option>)}
                          </optgroup>
                          <optgroup label="Setores Administrativos">
                             {departments.map(d => <option key={d.id} value={`${d.id}|department`}>{d.title}</option>)}
                          </optgroup>
                       </select>
                    </div>
                 </div>
                 <div className="pt-10 flex justify-end gap-4 border-t border-slate-100">
                    <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="px-10 py-5 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                    <button type="submit" className="bg-slate-900 text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center gap-3 border border-amber-500/20">
                       <Save size={20} className="text-amber-500" /> Salvar Colaborador
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: EDITAR DIRETORIA */}
      {isCeoModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-scale-in">
              <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Crown size={24} className="text-amber-500" /> {ceoForm.id ? 'Editar Diretor' : 'Novo Diretor'}</h3>
                 <button onClick={() => setIsCeoModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveCeo} className="p-8 space-y-6">
                 <div>
                    <label className="block text-[11px] font-black text-slate-950 uppercase mb-2 tracking-widest">Nome do Diretor</label>
                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-950 outline-none focus:ring-2 focus:ring-slate-900" value={ceoForm.name} onChange={e => setCeoForm({...ceoForm, name: e.target.value})} placeholder="Ex: Carlos Alberto" />
                 </div>
                 <div>
                    <label className="block text-[11px] font-black text-slate-950 uppercase mb-2 tracking-widest">Cargo / Função</label>
                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-950 outline-none" value={ceoForm.role} onChange={e => setCeoForm({...ceoForm, role: e.target.value})} placeholder="Ex: CEO" />
                 </div>
                 <div>
                    <label className="block text-[11px] font-black text-slate-950 uppercase mb-2 tracking-widest">Responsabilidades / Descrição</label>
                    <textarea className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-950 outline-none h-32 resize-none" value={ceoForm.description} onChange={e => setCeoForm({...ceoForm, description: e.target.value})} placeholder="Descreva as responsabilidades..." />
                 </div>
                 <div className="pt-8 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsCeoModalOpen(false)} className="px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Descartar</button>
                    <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center gap-2">
                       <Save size={18} className="text-amber-500" /> {ceoForm.id ? 'Atualizar' : 'Criar'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: NOVO SETOR (ORGANOGRAMA) */}
      {isDeptModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-scale-in">
              <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Layers size={24} className="text-amber-500" /> {deptForm.id ? 'Editar Setor' : 'Novo Setor Administrativo'}</h3>
                 <button onClick={() => setIsDeptModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveDept} className="p-8 space-y-6">
                 <div>
                    <label className="block text-[11px] font-black text-slate-950 uppercase mb-2 tracking-widest">Nome do Setor / Departamento</label>
                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-950 outline-none focus:ring-2 focus:ring-slate-900" value={deptForm.title} onChange={e => setDeptForm({...deptForm, title: e.target.value})} placeholder="Ex: Suprimentos & Logística" />
                 </div>
                 <div>
                    <label className="block text-[11px] font-black text-slate-950 uppercase mb-2 tracking-widest">Responsável pelo Setor</label>
                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-950 outline-none" value={deptForm.responsible} onChange={e => setDeptForm({...deptForm, responsible: e.target.value})} placeholder="Ex: Carlos Alberto" />
                 </div>
                 <div className="pt-8 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Descartar</button>
                    <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center gap-2">
                       <Save size={18} className="text-amber-500" /> {deptForm.id ? 'Atualizar Setor' : 'Criar Setor'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-scale-in border border-red-100">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertTriangle size={40}/></div>
              <h3 className="text-2xl font-black text-slate-950 uppercase mb-3">Remover Registro?</h3>
              <p className="text-slate-600 text-sm mb-10 leading-relaxed italic font-medium">Esta ação não pode ser desfeita e removerá o profissional ou setor permanentemente da estrutura.</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setConfirmDelete(null)} className="py-5 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Manter</button>
                 <button onClick={handleDelete} className="py-5 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all">Excluir Agora</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;
