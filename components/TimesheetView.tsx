
// This is a test comment.
import React, { useState, useMemo } from 'react';
import { Project, Employee, TimesheetRecord, UserRole } from '../types';
import { uploadFile } from '../services/fileService';
import { 
  ClipboardList, 
  Plus, 
  X,
  Save,
  MessageSquare,
  AlertCircle,
  HardHat,
  Coins,
  CalendarRange,
  CheckCircle2,
  Calendar,
  Search,
  Trash2,
  Filter,
  User,
  Building2,
  Users,
  Banknote,
  Clock,
  UploadCloud,
  Paperclip,
  Edit
} from 'lucide-react';

interface TimesheetViewProps {
  employees: Employee[];
  projects: Project[];
  records: TimesheetRecord[];
  onAddBatch: (records: TimesheetRecord[]) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteBatch?: (ids: string[]) => void;
  userRole?: UserRole;
}

const TimesheetView: React.FC<TimesheetViewProps> = ({ employees, projects, records, onAddBatch, onDeleteRecord, onDeleteBatch, userRole }) => {
  const [viewMode, setViewMode] = useState<'records' | 'employees'>('employees');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const isAdmin = userRole === 'admin';

  // State for single record modal
  const [isSingleRecordModalOpen, setIsSingleRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimesheetRecord | null>(null);
  const [singleRecordEmployeeId, setSingleRecordEmployeeId] = useState<string>('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{ text: string, total: number } | null>(null);

  const getInitialFormState = (): Omit<TimesheetRecord, 'id' | 'employeeName' | 'totalPay'> => ({
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    status: 'Presente',
    standardHours: 8,
    dailyRate: 0,
    hourlyRate: 0,
    overtimeHours: 0,
    advanceDeduction: 0,
    notes: '',
    attachments: [],
  });

  const [singleRecordFormData, setSingleRecordFormData] = useState(getInitialFormState());

  const handleSingleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsUploading(true);
    try {
      const newAttachments = await Promise.all(
        attachmentFiles.map(async (file) => {
          const { url, fileName } = await uploadFile(file);
          return { name: fileName, url };
        })
      );

      const recordData = {
        ...singleRecordFormData,
        totalPay: 0, // This will be recalculated
      };

      // Recalculate totalPay
      const dailyRate = recordData.dailyRate;
      const hourlyRate = dailyRate / 8;
      const overtimePay = recordData.overtimeHours * hourlyRate;
      const basePay = (recordData.status === 'Presente' || recordData.status === 'Escritório') ? (dailyRate * (recordData.standardHours / 8)) : 0;
      recordData.totalPay = Math.max(0, basePay + overtimePay - recordData.advanceDeduction);
      recordData.hourlyRate = hourlyRate;

      let employeeName = '';
      if (editingRecord) {
        employeeName = editingRecord.employeeName;
        const updatedRecord: TimesheetRecord = {
          ...editingRecord,
          ...recordData,
          attachments: [...(editingRecord.attachments || []), ...newAttachments],
        };
        const updatedRecords = records.map(r => r.id === editingRecord.id ? updatedRecord : r);
        onAddBatch(updatedRecords); 
      } else {
        const emp = employees.find(e => e.id === singleRecordEmployeeId);
        employeeName = emp?.name || 'Desconhecido';
        const newRecord: TimesheetRecord = {
          ...recordData,
          id: `ts-${Date.now()}`,
          employeeName: employeeName,
          attachments: newAttachments,
        };
        onAddBatch([newRecord]);
      }

      // Show success message with monthly total
      const newTotal = getEmployeeTotal(employeeName) + (editingRecord ? (recordData.totalPay - editingRecord.totalPay) : recordData.totalPay);
      setSuccessMessage({ text: 'Ponto atualizado com sucesso!', total: newTotal });

      setIsSingleRecordModalOpen(false);
      setEditingRecord(null);
      setAttachmentFiles([]);
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erro ao salvar o registro. Verifique os anexos.");
    } finally {
      setIsUploading(false);
    }
  };

  const getDefaultPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    let start, end;
    if (day >= 25) {
      start = new Date(year, month, 25);
      end = new Date(year, month + 1, 25);
    } else {
      start = new Date(year, month - 1, 25);
      end = new Date(year, month, 25);
    }
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const defaultPeriod = getDefaultPeriod();
  
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: defaultPeriod.start,
    endDate: defaultPeriod.end,
    projectId: '',
    status: 'Presente' as TimesheetRecord['status'],
    standardHours: 8,
    dailyRate: '',
    monthlyValue: '',
    overtimeHours: 0,
    advanceDeduction: '',
    notes: '',
    skipWeekends: true
  });

  const cycleRange = useMemo(() => {
    const [year, month] = filterMonth.split('-').map(Number);
    // O ciclo de Fevereiro (02) é de 25/01 a 24/02
    const start = new Date(year, month - 2, 25);
    const end = new Date(year, month - 1, 24);
    return { start, end };
  }, [filterMonth]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const recordDate = new Date(r.date);
      // Ajustar para considerar apenas a data sem hora para comparação precisa
      const d = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
      const s = new Date(cycleRange.start.getFullYear(), cycleRange.start.getMonth(), cycleRange.start.getDate());
      const e = new Date(cycleRange.end.getFullYear(), cycleRange.end.getMonth(), cycleRange.end.getDate());
      
      const matchesCycle = d >= s && d <= e;
      return matchesSearch && matchesCycle;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm, cycleRange]);

  const grandTotal = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.totalPay, 0);
  }, [filteredRecords]);

  const getEmployeeTotal = (employeeName: string) => {
    return records
      .filter(r => {
        const recordDate = new Date(r.date);
        const d = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const s = new Date(cycleRange.start.getFullYear(), cycleRange.start.getMonth(), cycleRange.start.getDate());
        const e = new Date(cycleRange.end.getFullYear(), cycleRange.end.getMonth(), cycleRange.end.getDate());
        return r.employeeName === employeeName && d >= s && d <= e;
      })
      .reduce((sum, r) => sum + r.totalPay, 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !formData.employeeId || !formData.startDate || !formData.endDate) return;

    const employee = employees.find(e => e.id === formData.employeeId);
    if (!employee) return;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    // Calculate daily rate from monthly value if provided
    let inputDailyRate = Number(formData.dailyRate);
    if (formData.monthlyValue && !inputDailyRate) {
      inputDailyRate = Number(formData.monthlyValue) / 22; // Assuming 22 working days
    }
    if (!inputDailyRate) {
      inputDailyRate = employee.baseRate || 0;
    }

    const calculatedHourlyRate = inputDailyRate / 8;
    
    const newRecordsBatch: TimesheetRecord[] = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (!formData.skipWeekends || !isWeekend) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const overtimePay = Number(formData.overtimeHours) * calculatedHourlyRate;
        const deduction = Number(formData.advanceDeduction) || 0;
        const hoursFactor = formData.standardHours / 8;
        const basePay = (formData.status === 'Presente' || formData.status === 'Escritório') ? (inputDailyRate * hoursFactor) : 0;
        const totalPay = Math.max(0, basePay + overtimePay - deduction);

        newRecordsBatch.push({
          id: Math.random().toString(36).substr(2, 9),
          employeeName: employee.name,
          date: dateStr,
          projectId: formData.projectId || 'N/A',
          status: formData.status,
          standardHours: formData.standardHours,
          dailyRate: inputDailyRate,
          hourlyRate: calculatedHourlyRate,
          overtimeHours: Number(formData.overtimeHours),
          advanceDeduction: deduction,
          totalPay: totalPay,
          notes: formData.notes
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    onAddBatch(newRecordsBatch);
    
    // Show success message with monthly total
    const batchTotal = newRecordsBatch.reduce((sum, r) => sum + r.totalPay, 0);
    const newTotal = getEmployeeTotal(employee.name) + batchTotal;
    setSuccessMessage({ text: 'Lote de pontos gerado com sucesso!', total: newTotal });

    setIsModalOpen(false);
    const nextPeriod = getDefaultPeriod();
    setFormData({
      employeeId: '',
      startDate: nextPeriod.start,
      endDate: nextPeriod.end,
      projectId: '',
      status: 'Presente',
      standardHours: 8,
      dailyRate: '',
      monthlyValue: '',
      overtimeHours: 0,
      advanceDeduction: '',
      notes: '',
      skipWeekends: true
    });

    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleDeleteEmployeeCycle = (employeeName: string) => {
    if (!isAdmin || !onDeleteBatch) return;
    const recordsToDelete = filteredRecords.filter(r => r.employeeName === employeeName);
    if (recordsToDelete.length === 0) {
      alert("Nenhum registro para apagar neste ciclo para este funcionário.");
      return;
    }
    if (!confirm(`Tem certeza que deseja apagar TODOS os ${recordsToDelete.length} registros de ${employeeName} no ciclo atual?`)) return;
    
    const idsToDelete = recordsToDelete.map(r => r.id);
    onDeleteBatch(idsToDelete);
  };

  const handleDeleteCycle = () => {
    if (!isAdmin || !onDeleteBatch) return;
    if (!confirm(`Tem certeza que deseja apagar TODOS os ${filteredRecords.length} registros do ciclo atual (${cycleRange.start.toLocaleDateString('pt-PT')} a ${cycleRange.end.toLocaleDateString('pt-PT')})?`)) return;
    
    const idsToDelete = filteredRecords.map(r => r.id);
    onDeleteBatch(idsToDelete);
  };

  const handleOpenEditModal = (record: TimesheetRecord) => {
    setEditingRecord(record);
    setSingleRecordFormData({
      ...getInitialFormState(),
      date: record.date,
      projectId: record.projectId,
      status: record.status,
      standardHours: record.standardHours,
      dailyRate: record.dailyRate,
      hourlyRate: record.hourlyRate,
      overtimeHours: record.overtimeHours,
      advanceDeduction: record.advanceDeduction,
      notes: record.notes || '',
      attachments: record.attachments || [],
    });
    setIsSingleRecordModalOpen(true);
  };

  const openEmployeeModal = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setFormData(prev => ({
      ...prev,
      employeeId: empId,
      projectId: emp?.allocationType === 'project' ? emp.allocationId : '',
      dailyRate: emp?.baseRate?.toString() || ''
    }));
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Folha de Ponto & Diárias</h2>
            <p className="text-slate-600 font-medium italic">
              Ciclo: {cycleRange.start.toLocaleDateString('pt-PT')} a {cycleRange.end.toLocaleDateString('pt-PT')}
            </p>
          </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('employees')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'employees' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users size={14} /> Colaboradores
            </button>
            <button 
              onClick={() => setViewMode('records')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'records' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ClipboardList size={14} /> Registros
            </button>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditingRecord(null);
                  setSingleRecordFormData(getInitialFormState());
                  setSingleRecordEmployeeId('');
                  setIsSingleRecordModalOpen(true);
                }}
                className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg flex items-center gap-3 transition-all active:scale-95"
              >
                <Plus size={18} /> Lançamento Individual
              </button>
              <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-teal-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl flex items-center gap-3 transition-all active:scale-95 border border-white/10"
              >
                  <CalendarRange size={18} /> Lançar em Lote
              </button>
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="fixed top-24 right-8 z-[200] animate-slide-in-right">
          <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-teal-500/30 flex items-center gap-6">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-1">{successMessage.text}</p>
              <p className="text-lg font-black tracking-tight">Total Acumulado: <span className="text-teal-400 font-mono">€ {successMessage.total.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span></p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {viewMode === 'employees' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
            <div key={emp.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:bg-teal-600 transition-colors">
                  {emp.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{emp.name}</h3>
                  <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">{emp.role}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Mês</p>
                  <p className="text-sm font-black text-emerald-600">€ {getEmployeeTotal(emp.name).toLocaleString('pt-PT', {minimumFractionDigits: 2})}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                  <Building2 size={14} className="text-slate-400" />
                  <span>{emp.allocationType === 'project' ? projects.find(p => p.id === emp.allocationId)?.name : 'Escritório'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                  <Coins size={14} className="text-slate-400" />
                  <span>Base: € {emp.baseRate?.toLocaleString('pt-PT', {minimumFractionDigits: 2}) || '0,00'} / dia</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEmployeeModal(emp.id)}
                  className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-200"
                >
                  <CalendarRange size={16} /> Lançar Ponto
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteEmployeeCycle(emp.name)}
                    className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-200"
                    title="Apagar registros do ciclo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-3 text-slate-900" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por funcionário..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-400" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
             </div>
             <div className="flex gap-4 items-center">
                <Filter size={18} className="text-slate-400" />
                <input 
                  type="month" 
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none text-slate-900" 
                  value={filterMonth} 
                  onChange={(e) => setFilterMonth(e.target.value)} 
                />
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                         <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">Data</th>
                         <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">Colaborador</th>
                         <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">Alocação</th>
                         <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest text-center">Status</th>
                         <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest text-right">Valor Líquido (€)</th>
                         {isAdmin && <th className="py-5 px-8 text-[9px] font-black text-slate-700 uppercase tracking-widest text-center">Ações</th>}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-all group">
                           <td className="py-5 px-8 text-xs font-black text-slate-900">{r.date ? new Date(r.date).toLocaleDateString('pt-PT') : 'N/A'}</td>
                           <td className="py-5 px-8">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-[10px] text-slate-900 border border-slate-200">{r.employeeName.substring(0, 2).toUpperCase()}</div>
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{r.employeeName}</p>
                              </div>
                           </td>
                           <td className="py-5 px-8">
                              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5 truncate max-w-[150px]">
                                 <Building2 size={12}/> {projects.find(p => p.id === r.projectId)?.name || 'Escritório / Geral'}
                              </span>
                           </td>
                           <td className="py-5 px-8 text-center">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${
                                r.status === 'Presente' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                                r.status === 'Falta' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}>
                                {r.status}
                              </span>
                           </td>
                           <td className="py-5 px-8 text-sm font-black text-right text-emerald-900 font-mono">€ {r.totalPay.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
                           {isAdmin && (
                             <td className="py-5 px-8 text-center">
                                <button onClick={() => onDeleteRecord(r.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                   <Trash2 size={16} />
                                </button>
                             </td>
                           )}
                        </tr>
                      ))}
                      {filteredRecords.length > 0 && (
                        <tr className="bg-slate-900 text-white">
                           <td colSpan={4} className="py-6 px-8 text-xs font-black uppercase tracking-widest text-right">Total Geral do Período:</td>
                           <td className="py-6 px-8 text-lg font-black text-right text-emerald-400 font-mono">€ {grandTotal.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
                           {isAdmin && <td className="py-6 px-8"></td>}
                        </tr>
                      )}
                      {filteredRecords.length === 0 && (
                        <tr>
                           <td colSpan={6} className="py-24 text-center text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] italic">Nenhum registro de ponto encontrado para este mês.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {/* Modal de Lançamento Individual */}
      {isSingleRecordModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/10 animate-scale-in max-h-[95vh]">
            <div className="bg-slate-800 p-8 flex justify-between items-center text-white shrink-0">
              <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
                <ClipboardList size={28} /> {editingRecord ? 'Editar Registro' : 'Novo Registro de Ponto'}
              </h3>
              <button onClick={() => setIsSingleRecordModalOpen(false)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleSingleRecordSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Funcionário</label>
                    <select required className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordEmployeeId} onChange={(e) => setSingleRecordEmployeeId(e.target.value)}>
                      <option value="">Selecione...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Data</label>
                  <input type="date" required className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordFormData.date} onChange={(e) => setSingleRecordFormData({...singleRecordFormData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Status</label>
                  <select className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordFormData.status} onChange={(e) => setSingleRecordFormData({...singleRecordFormData, status: e.target.value as any})}>
                    <option value="Presente">Presente</option>
                    <option value="Falta">Falta</option>
                    <option value="Folga">Folga</option>
                    <option value="Escritório">Escritório</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Vincular a Obra</label>
                  <select className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordFormData.projectId} onChange={(e) => setSingleRecordFormData({...singleRecordFormData, projectId: e.target.value})}>
                    <option value="">Escritório / Administrativo</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Horas Normais</label>
                  <input type="number" step="0.5" className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordFormData.standardHours} onChange={(e) => setSingleRecordFormData({...singleRecordFormData, standardHours: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Horas Extras</label>
                  <input type="number" step="0.5" className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordFormData.overtimeHours} onChange={(e) => setSingleRecordFormData({...singleRecordFormData, overtimeHours: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Valor da Diária (€)</label>
                  <input type="number" step="0.01" className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordFormData.dailyRate} onChange={(e) => setSingleRecordFormData({...singleRecordFormData, dailyRate: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Adiantamento (€)</label>
                  <input type="number" step="0.01" className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordFormData.advanceDeduction} onChange={(e) => setSingleRecordFormData({...singleRecordFormData, advanceDeduction: Number(e.target.value)})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Notas</label>
                  <textarea className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none" value={singleRecordFormData.notes} onChange={(e) => setSingleRecordFormData({...singleRecordFormData, notes: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Anexos</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-white relative group flex flex-col items-center justify-center">
                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setAttachmentFiles(Array.from(e.target.files || []))} />
                    <UploadCloud size={32} className="text-slate-400 group-hover:text-teal-600 mb-2 transition-all" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {attachmentFiles.length > 0 ? `${attachmentFiles.length} arquivos selecionados` : 'Arrastar ou clicar para selecionar'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsSingleRecordModalOpen(false)} className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" disabled={isUploading} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center gap-2">
                  {isUploading ? 'Salvando...' : (editingRecord ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-white/10 animate-scale-in max-h-[95vh]">
            <div className="bg-teal-600 p-10 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black flex items-center gap-4 uppercase tracking-tighter">
                  <CalendarRange size={36} className="text-white" /> Lançamento em Lote
                </h3>
                <p className="text-[10px] text-teal-100 font-black uppercase tracking-[0.3em] mt-3 italic">Geração automática de extratos de presença</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all relative z-10"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-widest border-l-4 border-teal-500 pl-3">Identificação do Período</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Funcionário</label>
                        <div className="relative">
                           <User className="absolute left-6 top-5 text-slate-400" size={20} />
                           <select required className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer" value={formData.employeeId} onChange={(e) => {
                             const empId = e.target.value;
                             const emp = employees.find(e => e.id === empId);
                             setFormData({
                               ...formData, 
                               employeeId: empId,
                               monthlyValue: emp?.monthlySalary?.toString() || emp?.baseRate?.toString() || '',
                               dailyRate: ''
                             });
                           }}>
                              <option value="">Selecione o profissional...</option>
                              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                           </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Data Início</label>
                        <div className="relative group">
                           <Calendar className="absolute left-6 top-5 text-teal-600" size={20} />
                           <input type="date" required className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Data Fim</label>
                        <div className="relative group">
                           <Calendar className="absolute left-6 top-5 text-red-500" size={20} />
                           <input type="date" required className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                        </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-widest border-l-4 border-teal-500 pl-3">Vínculo e Remuneração</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Vincular a Obra</label>
                        <div className="relative">
                           <Building2 className="absolute left-6 top-5 text-slate-400" size={20} />
                           <select className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer" value={formData.projectId} onChange={(e) => setFormData({...formData, projectId: e.target.value})}>
                              <option value="">Escritório / Administrativo</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Valor da Diária (€)</label>
                        <div className="relative">
                           <Coins className="absolute left-6 top-5 text-emerald-600" size={20} />
                           <input type="number" step="0.01" className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: e.target.value, monthlyValue: ''})} placeholder="0.00" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">OU Valor Mensal (€)</label>
                        <div className="relative">
                           <Banknote className="absolute left-6 top-5 text-blue-600" size={20} />
                           <input type="number" step="0.01" className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" value={formData.monthlyValue} onChange={e => setFormData({...formData, monthlyValue: e.target.value, dailyRate: ''})} placeholder="0.00" />
                        </div>
                        {formData.monthlyValue && (
                          <p className="mt-2 text-[9px] font-black text-blue-600 uppercase tracking-widest italic">
                            Equivale a € {(Number(formData.monthlyValue) / 22).toFixed(2)} / dia (Ref: 22 dias)
                          </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Horas Extras</label>
                        <div className="relative">
                           <Clock className="absolute left-6 top-5 text-amber-600" size={20} />
                           <input type="number" step="0.5" className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" value={formData.overtimeHours} onChange={e => setFormData({...formData, overtimeHours: Number(e.target.value)})} placeholder="0" />
                        </div>
                        {(formData.dailyRate || formData.monthlyValue) && (
                          <p className="mt-2 text-[9px] font-black text-amber-600 uppercase tracking-widest italic">
                            Valor da Hora: € {((Number(formData.dailyRate) || (Number(formData.monthlyValue) / 22)) / 8).toFixed(2)}
                          </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Status de Presença</label>
                        <select className="w-full px-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="Presente">Presente (Em Obra)</option>
                            <option value="Escritório">No Escritório</option>
                            <option value="Falta">Falta Justificada/Não</option>
                            <option value="Folga">Folga / Descanso</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white border-2 border-slate-200 rounded-[1.5rem]">
                        <input 
                           type="checkbox" 
                           id="skipWeekends" 
                           className="w-6 h-6 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                           checked={formData.skipWeekends} 
                           onChange={(e) => setFormData({...formData, skipWeekends: e.target.checked})} 
                        />
                        <label htmlFor="skipWeekends" className="text-[11px] font-black text-slate-950 uppercase cursor-pointer select-none">Ignorar Sábados e Domingos</label>
                    </div>
                 </div>
              </div>

              <div className="pt-10 flex flex-col md:flex-row justify-end gap-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-white rounded-2xl transition-all">Descartar</button>
                <button type="submit" className="bg-slate-900 text-white px-14 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-teal-500/30">
                   <CheckCircle2 size={24} className="text-teal-500" /> Confirmar Lote de Ponto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetView;
