
import React, { useState, useMemo } from 'react';
import { Project, Employee, TimesheetRecord, UserRole } from '../types';
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
  Building2
} from 'lucide-react';

interface TimesheetViewProps {
  employees: Employee[];
  projects: Project[];
  records: TimesheetRecord[];
  onAddBatch: (records: TimesheetRecord[]) => void;
  onDeleteRecord: (id: string) => void;
  userRole?: UserRole;
}

const TimesheetView: React.FC<TimesheetViewProps> = ({ employees, projects, records, onAddBatch, onDeleteRecord, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const isAdmin = userRole === 'admin';
  
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    projectId: '',
    status: 'Presente' as TimesheetRecord['status'],
    standardHours: 8,
    dailyRate: '',
    overtimeHours: 0,
    advanceDeduction: '',
    notes: '',
    skipWeekends: true
  });

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = r.date.startsWith(filterMonth);
      return matchesSearch && matchesMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm, filterMonth]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !formData.employeeId || !formData.startDate || !formData.endDate) return;

    const employee = employees.find(e => e.id === formData.employeeId);
    if (!employee) return;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const inputDailyRate = Number(formData.dailyRate) || employee.baseRate || 0;
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
    setIsModalOpen(false);
    setFormData({
      employeeId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      projectId: '',
      status: 'Presente',
      standardHours: 8,
      dailyRate: '',
      overtimeHours: 0,
      advanceDeduction: '',
      notes: '',
      skipWeekends: true
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Folha de Ponto & Diárias</h2>
          <p className="text-slate-600 font-medium italic">Controle de presença e remuneração automatizada da equipe</p>
        </div>
        {isAdmin && (
          <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-teal-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl flex items-center gap-3 transition-all active:scale-95 border border-white/10"
          >
              <Plus size={20} className="text-white" /> Lançar Ponto em Lote
          </button>
        )}
      </div>

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
                  {filteredRecords.length === 0 && (
                    <tr>
                       <td colSpan={6} className="py-24 text-center text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] italic">Nenhum registro de ponto encontrado para este mês.</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

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
                           <select required className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer" value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})}>
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
                           <input type="number" step="0.01" className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: e.target.value})} placeholder="0.00" />
                        </div>
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
