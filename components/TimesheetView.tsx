
import React, { useState, useMemo } from 'react';
import { Project, Employee, TimesheetRecord, UserRole } from '../types';
import { 
  ClipboardList, 
  Plus, 
  Filter, 
  Download, 
  Clock, 
  DollarSign, 
  X,
  Save,
  MessageSquare,
  AlertCircle,
  HardHat,
  ChevronDown,
  ChevronRight,
  Coins,
  CalendarRange,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface TimesheetViewProps {
  employees: Employee[];
  projects: Project[];
  records: TimesheetRecord[];
  onAddRecord: (record: TimesheetRecord) => void;
  userRole?: UserRole;
}

const TimesheetView: React.FC<TimesheetViewProps> = ({ employees, projects, records, onAddRecord, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const isAdmin = userRole === 'admin';
  
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  // Form State atualizado para suportar Range e Horas Flexíveis
  const [formData, setFormData] = useState({
    employeeName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    projectId: '',
    status: 'Presente' as 'Presente' | 'Falta' | 'Folga' | 'Escritório',
    standardHours: 8,
    dailyRate: '',
    overtimeHours: 0,
    advanceDeduction: '',
    notes: '',
    skipWeekends: true
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !formData.employeeName || !formData.startDate || !formData.endDate) return;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const inputDailyRate = Number(formData.dailyRate) || 0;
    const calculatedHourlyRate = inputDailyRate / 8;
    
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

        const newRecord: TimesheetRecord = {
          id: Math.random().toString(36).substr(2, 9),
          employeeName: formData.employeeName,
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
        };

        onAddRecord(newRecord);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Folha de Ponto & Diárias</h2>
          <p className="text-slate-500 font-medium">Controle de presença e remuneração da equipe</p>
        </div>
        <div className="flex gap-3">
           {isAdmin && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-black hover:bg-teal-700 shadow-lg shadow-teal-600/20 flex items-center gap-2 active:scale-95 transition-all"
            >
                <Plus size={18} /> Lançar Ponto (Lote)
            </button>
           )}
        </div>
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/20">
            <div className="bg-teal-600 p-8 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <CalendarRange size={28} /> Lançamento em Lote
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Status da Presença</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-wrap gap-1">
                    {(['Presente', 'Escritório', 'Falta', 'Folga'] as const).map((s) => (
                        <button key={s} type="button" onClick={() => setFormData({...formData, status: s})} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${formData.status === s ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-black font-bold'}`}>{s}</button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-black text-black uppercase mb-1.5 tracking-widest">Funcionário</label>
                    <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black outline-none focus:ring-2 focus:ring-teal-500" value={formData.employeeName} onChange={(e) => setFormData({...formData, employeeName: e.target.value})}>
                      <option value="">Selecione...</option>
                      {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-1.5 tracking-widest">Data Início</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-3.5 text-black" />
                      <input type="date" required className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-1.5 tracking-widest">Data Fim</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-3.5 text-black" />
                      <input type="date" required className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-black text-black uppercase mb-1.5 tracking-widest">Valor da Diária (€)</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-3.5 text-black" size={14} />
                      <input type="number" step="0.01" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-black" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: e.target.value})} placeholder="0.00" />
                    </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-100 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="bg-teal-600 text-white px-10 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:bg-teal-700 active:scale-95 transition-all flex items-center gap-2"><CheckCircle2 size={18} /> Confirmar Lote</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetView;
