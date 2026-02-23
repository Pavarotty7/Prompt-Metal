
import React, { useState, useMemo, useRef } from 'react';
import { Project, MaterialLog, UserRole, Employee, ProjectDocument, BudgetTask, ProjectStatus } from '../types';
import BudgetProgressManager from './BudgetProgressManager';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  FileText, 
  HardHat,
  X,
  DollarSign,
  UploadCloud,
  Calendar,
  Paperclip,
  MapPin,
  User,
  Files,
  Eye,
  Ban,
  Users,
  CheckCircle2,
  Trash2,
  Briefcase,
  Save,
  Truck,
  ListChecks,
  Clock,
  Pencil
} from 'lucide-react';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  userRole?: UserRole;
  employees?: Employee[];
  onUpdateProject?: (project: Project) => void;
}

type TabType = 'budget-progress' | 'materials' | 'team' | 'statement' | 'documents';

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, onBack, userRole, employees = [], onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<TabType>('budget-progress');
  const isAdmin = userRole === 'admin';
  const materialFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const materials = useMemo(() => project.materialLogs || [], [project.materialLogs]);
  const projectDocuments = useMemo(() => project.documents || [], [project.documents]);

  const allocatedTeam = useMemo(() => 
    employees.filter(e => e.allocationId === project.id && e.allocationType === 'project'),
  [employees, project.id]);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  
  const [materialForm, setMaterialForm] = useState({
    date: new Date().toISOString().split('T')[0],
    materialName: '',
    quantity: '',
    unit: 'un',
    unitPrice: '',
    supplier: '',
    invoice: ''
  });
  const [materialAttachment, setMaterialAttachment] = useState<File | null>(null);

  const [docForm, setDocForm] = useState({
    name: '',
    type: 'Planta' as ProjectDocument['type'],
  });
  const [docAttachment, setDocAttachment] = useState<File | null>(null);

  const [newChecklistItem, setNewChecklistItem] = useState({ text: '', critical: false, deadline: '' });

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !onUpdateProject) return;

    const materialData = {
      materialName: materialForm.materialName,
      quantity: Number(materialForm.quantity),
      unit: materialForm.unit,
      unitPrice: Number(materialForm.unitPrice),
      date: materialForm.date,
      supplier: materialForm.supplier,
      invoice: materialForm.invoice,
      attachmentName: materialAttachment?.name,
      attachmentUrl: materialAttachment ? URL.createObjectURL(materialAttachment) : undefined
    };

    let updatedMaterialLogs = [...(project.materialLogs || [])];
    let newSpent = project.spent;

    if (editingMaterialId) {
      const index = updatedMaterialLogs.findIndex(m => m.id === editingMaterialId);
      if (index !== -1) {
        const oldMaterial = updatedMaterialLogs[index];
        const oldCost = oldMaterial.quantity * oldMaterial.unitPrice;
        const newCost = materialData.quantity * materialData.unitPrice;
        
        updatedMaterialLogs[index] = {
          ...oldMaterial,
          ...materialData,
          attachmentName: materialData.attachmentName || oldMaterial.attachmentName,
          attachmentUrl: materialData.attachmentUrl || oldMaterial.attachmentUrl
        };
        newSpent = project.spent - oldCost + newCost;
      }
    } else {
      const newMaterial: MaterialLog = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: project.id,
        ...materialData,
        type: 'entrada'
      };
      updatedMaterialLogs = [newMaterial, ...updatedMaterialLogs];
      newSpent = project.spent + (newMaterial.quantity * newMaterial.unitPrice);
    }

    onUpdateProject({
      ...project,
      materialLogs: updatedMaterialLogs,
      spent: newSpent
    });

    setIsMaterialModalOpen(false);
    setEditingMaterialId(null);
    setMaterialForm({ date: new Date().toISOString().split('T')[0], materialName: '', quantity: '', unit: 'un', unitPrice: '', supplier: '', invoice: '' });
    setMaterialAttachment(null);
  };

  const handleEditMaterial = (material: MaterialLog) => {
    setEditingMaterialId(material.id);
    setMaterialForm({
      date: material.date,
      materialName: material.materialName,
      quantity: material.quantity.toString(),
      unit: material.unit,
      unitPrice: material.unitPrice.toString(),
      supplier: material.supplier,
      invoice: material.invoice
    });
    setIsMaterialModalOpen(true);
  };

  const handleDeleteMaterial = (id: string) => {
    if (!isAdmin || !onUpdateProject) return;
    if (!confirm("Confirmar exclusão deste material?")) return;

    const materialToDelete = project.materialLogs?.find(m => m.id === id);
    if (!materialToDelete) return;

    const costReduction = materialToDelete.quantity * materialToDelete.unitPrice;
    const updatedLogs = (project.materialLogs || []).filter(m => m.id !== id);

    onUpdateProject({
      ...project,
      materialLogs: updatedLogs,
      spent: Math.max(0, project.spent - costReduction)
    });
  };

  const handleUpdateBudgetTasks = (newTasks: BudgetTask[], newTotalProgress: number) => {
    if (!onUpdateProject) return;
    onUpdateProject({
      ...project,
      tarefas: newTasks,
      progress: newTotalProgress
    });
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !onUpdateProject) return;

    let driveUrl = undefined;
    
    // Upload to Google Drive if connected
    if (docAttachment) {
      try {
        const statusRes = await fetch('/api/auth/google/status');
        const { connected } = await statusRes.json();
        
        if (connected) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(docAttachment);
          });
          
          const base64 = await base64Promise;
          const uploadRes = await fetch('/api/drive/upload-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: docAttachment.name,
              mimeType: docAttachment.type,
              content: base64,
              folderName: `PromptMetal - ${project.name}`
            })
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            driveUrl = uploadData.url;
          }
        }
      } catch (error) {
        console.error("Error syncing to Drive:", error);
      }
    }

    const newDoc: ProjectDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: docForm.name || docAttachment?.name || 'Documento',
      type: docForm.type,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Válido',
      fileName: docAttachment?.name || 'anexo.pdf',
      url: driveUrl || (docAttachment ? URL.createObjectURL(docAttachment) : undefined)
    };

    onUpdateProject({
      ...project,
      documents: [newDoc, ...(project.documents || [])]
    });

    setIsDocModalOpen(false);
    setDocForm({ name: '', type: 'Planta' });
    setDocAttachment(null);
  };

  const handleInvalidateDoc = (id: string) => {
    if (!isAdmin || !onUpdateProject) return;
    
    const updatedDocs = (project.documents || []).map(doc => 
      doc.id === id ? { ...doc, status: 'Inválido' as const } : doc
    );

    onUpdateProject({
      ...project,
      documents: updatedDocs
    });
  };

  const getStatusClass = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNED: return 'bg-slate-100 text-slate-700 border-slate-200';
      case ProjectStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ProjectStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case ProjectStatus.DELAYED: return 'bg-red-100 text-red-800 border-red-200';
      case ProjectStatus.WAITING_DOCUMENT: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isAdmin || !onUpdateProject) return;
    const newStatus = e.target.value as ProjectStatus;
    onUpdateProject({ ...project, status: newStatus });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-800 hover:text-slate-600 font-black uppercase text-[10px] tracking-widest transition-all">
          <ArrowLeft size={16} /> Voltar para Obras
        </button>
        <div className="flex gap-2">
          {isAdmin ? (
            <select 
              value={project.status} 
              onChange={handleStatusChange}
              className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border appearance-none outline-none cursor-pointer transition-all ${getStatusClass(project.status)}`}
            >
              <option value={ProjectStatus.PLANNED}>Planejada</option>
              <option value={ProjectStatus.IN_PROGRESS}>Em Andamento</option>
              <option value={ProjectStatus.COMPLETED}>Concluída</option>
              <option value={ProjectStatus.DELAYED}>Atrasada</option>
              <option value={ProjectStatus.WAITING_DOCUMENT}>Aguardando Documento</option>
            </select>
          ) : (
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusClass(project.status)}`}>
                {project.status}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="p-10 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div>
               <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">{project.name}</h1>
               <div className="flex flex-wrap gap-4 text-xs font-black text-slate-700 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><User size={14} className="text-slate-900"/> {project.client}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-900"/> {project.address}</span>
                  <span className="flex items-center gap-1.5"><HardHat size={14} className="text-slate-900"/> Responsável: {project.responsible}</span>
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Início</p>
                  <p className="text-sm font-black text-slate-900">{new Date(project.startDate).toLocaleDateString('pt-PT')}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Término</p>
                  <p className="text-sm font-black text-slate-900">{new Date(project.endDate).toLocaleDateString('pt-PT')}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Orçamento</p>
                  <p className="text-sm font-black text-slate-900">€ {project.budget.toLocaleString('pt-PT')}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Custo Atual</p>
                  <p className="text-sm font-black text-red-700">€ {project.spent.toLocaleString('pt-PT')}</p>
               </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] p-8 border border-slate-200 print:border-none">
             <div className="relative w-32 h-32 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                   <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200" />
                   <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * project.progress) / 100} className="text-slate-900 transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-2xl font-black text-slate-900">{project.progress}%</span>
                </div>
             </div>
             <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Progresso Real</p>
          </div>
        </div>

        <div className="flex bg-slate-900 p-2 gap-1 overflow-x-auto no-scrollbar print:hidden">
            {(['budget-progress', 'materials', 'documents', 'team', 'statement'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                {tab === 'budget-progress' ? 'Planilha de Progresso' : tab === 'materials' ? 'Materiais' : tab === 'documents' ? 'Arquivo Técnico' : tab === 'team' ? 'Equipe' : 'Extrato'}
              </button>
            ))}
        </div>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'budget-progress' && (
          <BudgetProgressManager 
            project={project} 
            isAdmin={isAdmin} 
            onUpdateTasks={handleUpdateBudgetTasks} 
          />
        )}

        {activeTab === 'materials' && (
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
             <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div><h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Package size={18} /> Livro de Materiais</h3><p className="text-[9px] font-bold text-slate-600 uppercase mt-1">Auditado por NF e Fornecedor</p></div>
                {isAdmin && (<button onClick={() => setIsMaterialModalOpen(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 shadow-xl"><Plus size={16} className="text-amber-500" /> Lançar Entrada</button>)}
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">Data</th>
                          <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">Material</th>
                          <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">NF</th>
                          <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest text-center">Quant.</th>
                          <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest text-right">Total (€)</th>
                          <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {materials.length > 0 ? materials.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-all group">
                            <td className="py-5 px-8 text-xs font-black text-slate-700 uppercase">{new Date(m.date).toLocaleDateString('pt-PT')}</td>
                            <td className="py-5 px-8 text-sm font-black text-slate-900 uppercase tracking-tight">{m.materialName}</td>
                            <td className="py-5 px-8"><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-slate-200">{m.invoice}</span></td>
                            <td className="py-5 px-8 text-xs font-black text-center text-slate-900">{m.quantity} {m.unit}</td>
                            <td className="py-5 px-8 text-sm font-black text-right text-emerald-800">{(m.quantity * m.unitPrice).toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
                            <td className="py-5 px-8">
                              <div className="flex items-center justify-center gap-2">
                                {m.attachmentUrl && (
                                  <button onClick={() => setViewingAttachment(m.attachmentUrl!)} className="p-2 text-slate-400 hover:text-slate-900 transition-all" title="Ver Anexo">
                                    <Paperclip size={14} />
                                  </button>
                                )}
                                {isAdmin && (
                                  <>
                                    <button onClick={() => handleEditMaterial(m)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all" title="Editar">
                                      <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteMaterial(m.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all" title="Excluir">
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="py-24 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest italic">Nenhum material registrado para esta obra.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
             </div>
           </div>
        )}

        {activeTab === 'documents' && (
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
             <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div><h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Files size={18} /> Arquivo Técnico da Obra</h3><p className="text-[9px] font-bold text-slate-600 uppercase mt-1">Plantas, Projetos e Certificações</p></div>
                {isAdmin && (<button onClick={() => setIsDocModalOpen(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 shadow-xl"><Plus size={16} className="text-amber-500" /> Novo Documento</button>)}
             </div>
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectDocuments.length > 0 ? projectDocuments.map(doc => (
                    <div key={doc.id} className={`p-6 bg-white border-2 rounded-3xl flex flex-col justify-between transition-all group ${doc.status === 'Inválido' ? 'border-red-100 opacity-60' : 'border-slate-100 hover:border-slate-900'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-100 rounded-2xl text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors"><FileText size={20} /></div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${doc.status === 'Válido' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>{doc.status}</span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{doc.name}</h4>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{doc.type}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(doc.uploadDate).toLocaleDateString('pt-PT')}</span>
                            <div className="flex gap-2">
                                {doc.url && <button onClick={() => setViewingAttachment(doc.url!)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Eye size={16}/></button>}
                                {isAdmin && doc.status === 'Válido' && <button onClick={() => handleInvalidateDoc(doc.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Ban size={16}/></button>}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                        <Files size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-slate-400 uppercase font-black text-[10px] tracking-widest italic">Nenhuma documentação técnica anexada.</p>
                    </div>
                )}
             </div>
           </div>
        )}

        {activeTab === 'team' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                <div className="p-8 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Users size={18} /> Equipe de Campo</h3>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-1">Pessoas alocadas atualmente a este projeto</p>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allocatedTeam.length > 0 ? allocatedTeam.map(emp => (
                        <div key={emp.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex items-center gap-5 hover:bg-white hover:shadow-xl transition-all group">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors"><Briefcase size={24}/></div>
                            <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{emp.name}</p>
                                <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">{emp.role}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${emp.type === 'CLT' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-300'}`}>{emp.type}</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                            <Users size={48} className="mx-auto text-slate-100 mb-4" />
                            <p className="text-slate-400 uppercase font-black text-[10px] tracking-widest italic">Nenhum funcionário alocado a esta obra.<br/><span className="text-[8px] font-bold">Acesse o módulo "Equipe" para realizar a alocação.</span></p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'statement' && (
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><DollarSign size={18} /> Resumo Orçamental</h3>
                  <p className="text-[9px] font-bold text-slate-600 uppercase mt-1">Comparativo de orçamento planejado vs custo real</p>
              </div>
              <div className="p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Budget Total</p>
                        <p className="text-3xl font-black">€ {project.budget.toLocaleString('pt-PT')}</p>
                    </div>
                    <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] text-red-900">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Total Executado</p>
                        <p className="text-3xl font-black">€ {project.spent.toLocaleString('pt-PT')}</p>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Margem de Obra</span>
                       <span className="text-lg font-black text-emerald-600">{(((project.budget - project.spent) / project.budget) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden p-1">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(0, ((project.budget - project.spent) / project.budget) * 100)}%` }} />
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* MODAL: LANÇAR MATERIAL */}
      {isMaterialModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-white/10 flex flex-col max-h-[95vh]">
              <div className="bg-slate-900 p-8 flex justify-between items-center text-white shrink-0">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                   <Package size={24} className="text-amber-500" /> 
                   {editingMaterialId ? 'Editar Registro de Material' : 'Registrar Entrada de Material'}
                 </h3>
                 <button onClick={() => { setIsMaterialModalOpen(false); setEditingMaterialId(null); }} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveMaterial} className="p-8 space-y-6 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Descrição do Material</label>
                       <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={materialForm.materialName} onChange={e => setMaterialForm({...materialForm, materialName: e.target.value})} placeholder="Ex: Viga IPE 200 S235JR" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Quantidade</label>
                       <input required type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black" value={materialForm.quantity} onChange={e => setMaterialForm({...materialForm, quantity: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Unidade</label>
                       <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black" value={materialForm.unit} onChange={e => setMaterialForm({...materialForm, unit: e.target.value})}>
                          <option value="un">Unidade (un)</option>
                          <option value="kg">Quilograma (kg)</option>
                          <option value="m2">Metro Quadrado (m2)</option>
                          <option value="m">Metro Linear (m)</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Preço Unitário (€)</label>
                       <input required type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-emerald-800" value={materialForm.unitPrice} onChange={e => setMaterialForm({...materialForm, unitPrice: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Data do Recebimento</label>
                       <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black" value={materialForm.date} onChange={e => setMaterialForm({...materialForm, date: e.target.value})} />
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Fornecedor</label>
                          <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black" value={materialForm.supplier} onChange={e => setMaterialForm({...materialForm, supplier: e.target.value})} placeholder="Razão Social" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Nº Fatura / Guia</label>
                          <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black" value={materialForm.invoice} onChange={e => setMaterialForm({...materialForm, invoice: e.target.value})} placeholder="NF-0000" />
                       </div>
                    </div>
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Anexar Comprovante (Opcional)</label>
                       <div 
                         className="border-2 border-dashed border-slate-300 rounded-[2rem] p-8 bg-slate-50 relative group flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100"
                         onClick={() => materialFileInputRef.current?.click()}
                       >
                          <UploadCloud size={32} className="text-slate-400 mb-2" />
                          <p className="text-[10px] font-black text-slate-600 uppercase">{materialAttachment ? materialAttachment.name : 'Selecionar Documento'}</p>
                          <input type="file" ref={materialFileInputRef} className="hidden" onChange={e => setMaterialAttachment(e.target.files?.[0] || null)} />
                       </div>
                    </div>
                 </div>
                 <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => { setIsMaterialModalOpen(false); setEditingMaterialId(null); }} className="px-6 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                    <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                       <Save size={18} className="text-amber-500" /> {editingMaterialId ? 'Atualizar Material' : 'Salvar Material'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: NOVO DOCUMENTO */}
      {isDocModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-white/10">
              <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Files size={24} className="text-blue-500" /> Novo Documento Técnico</h3>
                 <button onClick={() => setIsDocModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveDoc} className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Nome do Documento</label>
                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} placeholder="Ex: Projeto Estrutural de Cobertura" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Tipo de Documento</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900" value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value as any})}>
                       <option value="Planta">Planta</option>
                       <option value="Câmara">Câmara / Alvará</option>
                       <option value="Projeto">Projeto Técnico</option>
                       <option value="Outros">Outros</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Anexo (Foto/PDF)</label>
                    <div 
                      className="border-2 border-dashed border-slate-300 rounded-[2rem] p-8 bg-slate-50 relative group flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100"
                      onClick={() => docFileInputRef.current?.click()}
                    >
                       <UploadCloud size={32} className="text-slate-400 mb-2" />
                       <p className="text-[10px] font-black text-slate-600 uppercase">{docAttachment ? docAttachment.name : 'Clique para selecionar arquivo'}</p>
                       <input type="file" ref={docFileInputRef} className="hidden" onChange={e => setDocAttachment(e.target.files?.[0] || null)} />
                    </div>
                 </div>
                 <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsDocModalOpen(false)} className="px-6 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                    <button type="submit" disabled={!docAttachment} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-2 disabled:opacity-50">
                       <Save size={18} className="text-blue-500" /> Salvar no Arquivo
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: VISUALIZAÇÃO DE ANEXO */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4" onClick={() => setViewingAttachment(null)}>
           <div className="relative max-w-5xl max-h-[95vh] w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                   <FileText size={24} className="text-emerald-500" />
                   <h4 className="font-black text-sm uppercase tracking-widest">Visualização de Documento</h4>
                </div>
                <button onClick={() => setViewingAttachment(null)} className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-90"><X size={28}/></button>
              </div>
              <div className="p-4 flex items-center justify-center min-h-[500px] bg-slate-100 overflow-auto">
                 <img src={viewingAttachment} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" alt="Anexo" />
              </div>
              <div className="bg-white p-6 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setViewingAttachment(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Fechar Visualização</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetailView;
