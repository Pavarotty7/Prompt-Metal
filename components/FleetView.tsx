
import React, { useState, useMemo, useRef } from 'react';
import { Vehicle, VehicleDocument, MaintenanceRecord, UserRole } from '../types';
import { 
  Truck, 
  Fuel, 
  Wrench, 
  Plus, 
  X, 
  Save, 
  Droplets, 
  DollarSign, 
  Calendar, 
  FileText, 
  UploadCloud, 
  ShieldCheck, 
  Eye,
  Settings2,
  Gauge,
  CheckCircle2,
  Paperclip,
  History as HistoryIcon,
  TrendingUp,
  Info,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

// Extensão local para suportar histórico de combustível no objeto do veículo
interface VehicleWithFuel extends Vehicle {
  fuelHistory?: Array<{
    id: string;
    date: string;
    km: number;
    liters: number;
    cost: number;
    receiptUrl?: string;
    receiptName?: string;
  }>;
}

interface FleetViewProps {
  vehicles: VehicleWithFuel[];
  onUpdateVehicles?: (vehicles: VehicleWithFuel[]) => void;
  userRole?: UserRole;
}

const FleetView: React.FC<FleetViewProps> = ({ vehicles, onUpdateVehicles, userRole }) => {
  const isAdmin = userRole === 'admin';
  
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'docs' | 'history' | 'fuel'>('info'); 
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithFuel | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  
  // Forms
  const [vehicleForm, setVehicleForm] = useState<Partial<VehicleWithFuel>>({});
  const [fuelForm, setFuelForm] = useState({ date: new Date().toISOString().split('T')[0], km: '', liters: '', cost: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ date: new Date().toISOString().split('T')[0], type: '', cost: '', description: '' });
  const [docForm, setDocForm] = useState({ name: '', type: 'Outros' as VehicleDocument['type'], expiryDate: '' });
  
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Histórico combinado e ordenado
  const combinedHistory = useMemo(() => {
    if (!editingVehicle) return [];
    
    const fuel = (editingVehicle.fuelHistory || []).map(f => ({ ...f, eventType: 'fuel' as const }));
    const maint = (editingVehicle.maintenanceHistory || []).map(m => ({ ...m, eventType: 'maint' as const }));
    
    return [...fuel, ...maint].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [editingVehicle]);

  // Totais do veículo
  const vehicleStats = useMemo(() => {
    if (!editingVehicle) return { totalFuel: 0, totalMaint: 0, totalLiters: 0 };
    const totalFuel = (editingVehicle.fuelHistory || []).reduce((acc, curr) => acc + curr.cost, 0);
    const totalMaint = (editingVehicle.maintenanceHistory || []).reduce((acc, curr) => acc + curr.cost, 0);
    const totalLiters = (editingVehicle.fuelHistory || []).reduce((acc, curr) => acc + curr.liters, 0);
    return { totalFuel, totalMaint, totalLiters };
  }, [editingVehicle]);

  const handleOpenVehicleModal = (vehicle?: VehicleWithFuel, initialTab: 'info' | 'docs' | 'history' | 'fuel' = 'info') => {
    setModalTab(initialTab);
    setIsAddingItem(false);
    setAttachedFile(null);
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm({ ...vehicle });
      setFuelForm({ date: new Date().toISOString().split('T')[0], km: vehicle.currentKms.toString(), liters: '', cost: '' });
    } else {
      if (!isAdmin) return;
      setEditingVehicle(null);
      setVehicleForm({
        model: '', plate: '', year: new Date().getFullYear(),
        currentKms: 0, driver: '', status: 'Operacional',
        documents: [], maintenanceHistory: [], fuelHistory: []
      });
    }
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !onUpdateVehicles) return;

    const vehicleToSave: VehicleWithFuel = {
      id: editingVehicle?.id || Math.random().toString(36).substr(2, 9),
      model: vehicleForm.model || 'Sem Nome',
      plate: (vehicleForm.plate || '---').toUpperCase(),
      year: Number(vehicleForm.year) || new Date().getFullYear(),
      currentKms: Number(vehicleForm.currentKms) || 0,
      driver: vehicleForm.driver || 'Não atribuído',
      lastMaintenance: vehicleForm.lastMaintenance || '',
      nextMaintenance: vehicleForm.nextMaintenance || '',
      status: (vehicleForm.status as 'Operacional' | 'Manutenção') || 'Operacional',
      documents: vehicleForm.documents || [],
      maintenanceHistory: vehicleForm.maintenanceHistory || [],
      fuelHistory: vehicleForm.fuelHistory || []
    };

    const updatedList = editingVehicle 
      ? vehicles.map(v => v.id === editingVehicle.id ? vehicleToSave : v)
      : [vehicleToSave, ...vehicles];

    onUpdateVehicles(updatedList);
    setIsVehicleModalOpen(false);
  };

  const handleAddItem = () => {
    if (!isAdmin || !editingVehicle || !onUpdateVehicles) return;

    const updatedVehicle = { ...editingVehicle };

    if (modalTab === 'fuel') {
      const newFuelLog = {
        id: Math.random().toString(36).substr(2, 9),
        date: fuelForm.date,
        km: Number(fuelForm.km),
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        receiptUrl: attachedFile ? URL.createObjectURL(attachedFile) : undefined,
        receiptName: attachedFile ? attachedFile.name : undefined
      };
      updatedVehicle.fuelHistory = [newFuelLog, ...(updatedVehicle.fuelHistory || [])];
      updatedVehicle.currentKms = Number(fuelForm.km);
    } else if (modalTab === 'history') {
      // Registrar Manutenção via Aba de Histórico
      const newMaint: MaintenanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: maintenanceForm.date,
        type: maintenanceForm.type,
        cost: Number(maintenanceForm.cost),
        description: maintenanceForm.description,
        receiptUrl: attachedFile ? URL.createObjectURL(attachedFile) : undefined
      };
      updatedVehicle.maintenanceHistory = [newMaint, ...(updatedVehicle.maintenanceHistory || [])];
      updatedVehicle.lastMaintenance = maintenanceForm.date;
    } else if (modalTab === 'docs') {
      const newDoc: VehicleDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: docForm.name || (attachedFile ? attachedFile.name : 'Documento'),
        type: docForm.type,
        expiryDate: docForm.expiryDate,
        uploadDate: new Date().toISOString().split('T')[0],
        fileName: attachedFile ? attachedFile.name : 'upload.pdf',
        url: attachedFile ? URL.createObjectURL(attachedFile) : undefined
      };
      updatedVehicle.documents = [newDoc, ...(updatedVehicle.documents || [])];
    }

    const newList = vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
    onUpdateVehicles(newList);
    setEditingVehicle(updatedVehicle);
    setVehicleForm(updatedVehicle);
    setIsAddingItem(false);
    setAttachedFile(null);
    
    // Reset forms
    setFuelForm({ date: new Date().toISOString().split('T')[0], km: updatedVehicle.currentKms.toString(), liters: '', cost: '' });
    setMaintenanceForm({ date: new Date().toISOString().split('T')[0], type: '', cost: '', description: '' });
    setDocForm({ name: '', type: 'Outros', expiryDate: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestão de Frota</h2>
          <p className="text-slate-600 font-medium italic">Histórico detalhado de ativos e custos operacionais</p>
        </div>
        {isAdmin && (
          <button onClick={() => handleOpenVehicleModal()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl flex items-center gap-3 transition-all active:scale-95 border border-amber-500/30">
            <Plus size={18} className="text-amber-500" /> Adicionar Veículo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden group hover:shadow-2xl hover:border-slate-800 transition-all">
            <div className={`absolute top-0 left-0 w-2 h-full ${vehicle.status === 'Operacional' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg group-hover:bg-amber-500 transition-colors"><Truck size={32} /></div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl leading-none">{vehicle.model}</h3>
                  <div className="flex gap-2 items-center mt-2">
                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{vehicle.plate}</p>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{vehicle.year}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => handleOpenVehicleModal(vehicle)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200"><Settings2 size={24}/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Gauge size={10}/> Odômetro</p>
                <p className="text-sm font-black text-slate-900">{vehicle.currentKms?.toLocaleString('pt-PT')} <span className="text-[8px] opacity-50 uppercase ml-0.5">km</span></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldCheck size={10}/> Status</p>
                <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block border ${vehicle.status === 'Operacional' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>{vehicle.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOpenVehicleModal(vehicle, 'fuel')} className="py-4 bg-blue-50 text-blue-800 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white border border-blue-100 transition-all flex items-center justify-center gap-2">
                <Droplets size={16}/> Abastecer
              </button>
              <button onClick={() => handleOpenVehicleModal(vehicle, 'history')} className="py-4 bg-slate-50 text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white border border-slate-200 transition-all flex items-center justify-center gap-2">
                <HistoryIcon size={16}/> Histórico
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL PRINCIPAL DO VEÍCULO */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 animate-scale-in flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-10 flex justify-between items-center text-white shrink-0">
               <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                      <Truck size={32} className="text-amber-500" /> {editingVehicle ? `Perfil: ${editingVehicle.model}` : 'Nova Viatura'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestão Completa de Ciclo de Vida</p>
               </div>
               <button onClick={() => setIsVehicleModalOpen(false)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all"><X size={28} /></button>
            </div>

            <div className="flex bg-slate-100 p-2 gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 shrink-0">
                {(['info', 'docs', 'history', 'fuel'] as const).map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => { setModalTab(tab); setIsAddingItem(false); setAttachedFile(null); }} 
                    className={`flex-1 min-w-[150px] py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${modalTab === tab ? 'bg-white text-slate-900 shadow-xl border-b-4 border-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {tab === 'info' ? 'Cadastro' : tab === 'docs' ? 'Documentação' : tab === 'history' ? 'Histórico Geral' : 'Novo Abastecimento'}
                  </button>
                ))}
            </div>

            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                {modalTab === 'info' && (
                  <form onSubmit={handleSaveVehicle} className="space-y-8 max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Modelo do Veículo</label>
                        <input required type="text" className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} placeholder="Ex: Toyota Proace Cargo" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Matrícula</label>
                        <input required type="text" className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none uppercase placeholder:text-slate-400" value={vehicleForm.plate} onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value})} placeholder="XX-00-XX" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Ano</label>
                        <input required type="number" className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none placeholder:text-slate-400" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">KM Atual</label>
                        <div className="relative">
                           <Gauge className="absolute left-6 top-5 text-slate-900" size={20} />
                           <input required type="number" className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none focus:ring-2 focus:ring-slate-900" value={vehicleForm.currentKms} onChange={e => setVehicleForm({...vehicleForm, currentKms: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Status Técnico</label>
                        <select className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none appearance-none cursor-pointer focus:border-slate-900" value={vehicleForm.status} onChange={e => setVehicleForm({...vehicleForm, status: e.target.value as any})}>
                            <option value="Operacional">Viatura Operacional</option>
                            <option value="Manutenção">Em Manutenção / Oficina</option>
                        </select>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-end pt-10 border-t border-slate-100">
                        <button type="submit" className="bg-slate-900 text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center gap-3">
                           <Save size={20} className="text-amber-500" /> {editingVehicle ? 'Salvar Alterações' : 'Criar Registro'}
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {modalTab === 'docs' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pasta Digital de Documentos</h4>
                      {isAdmin && (
                        <button onClick={() => { setIsAddingItem(true); setAttachedFile(null); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-lg">
                           <Plus size={16}/> Novo Documento
                        </button>
                      )}
                    </div>

                    {isAddingItem && (
                      <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-300 animate-fade-in space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="col-span-1 md:col-span-2">
                              <label className="block text-[11px] font-black text-slate-950 uppercase mb-2">Anexar PDF / Foto</label>
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${attachedFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
                              >
                                <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                                {attachedFile ? (
                                  <div className="text-center">
                                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                                    <p className="text-xs font-black text-emerald-900 uppercase tracking-tight">{attachedFile.name}</p>
                                  </div>
                                ) : (
                                  <>
                                    <UploadCloud size={32} className="text-slate-400 mb-2" />
                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Carregar Documento</p>
                                  </>
                                )}
                              </div>
                           </div>
                           <div><label className="block text-[11px] font-black text-slate-950 uppercase mb-2">Identificação</label><input type="text" className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-xl text-sm font-black outline-none focus:border-slate-900 text-slate-900" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} placeholder="Ex: Seguro 2024" /></div>
                           <div><label className="block text-[11px] font-black text-slate-950 uppercase mb-2">Tipo de Doc</label><select className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-xl text-sm font-black outline-none text-slate-900" value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value as any})}><option value="Seguro">Seguro</option><option value="IPO">IPO (Inspeção)</option><option value="IUC">IUC (Imposto)</option><option value="Documento Único">Documento Único</option><option value="Outros">Outros</option></select></div>
                           <div><label className="block text-[11px] font-black text-slate-950 uppercase mb-2">Expiração</label><input type="date" className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-xl text-sm font-black outline-none text-slate-900" value={docForm.expiryDate} onChange={e => setDocForm({...docForm, expiryDate: e.target.value})} /></div>
                           <div className="flex items-end"><button onClick={handleAddItem} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg">Salvar Documento</button></div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {vehicleForm.documents?.map(doc => (
                         <div key={doc.id} className="p-6 bg-white border border-slate-200 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-slate-100 rounded-2xl text-slate-900"><FileText size={24}/></div>
                               <div><p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">{doc.name}</p><p className={`text-[9px] font-black uppercase tracking-widest ${doc.expiryDate && new Date(doc.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>Vencimento: {doc.expiryDate || 'Vigente'}</p></div>
                            </div>
                            <div className="flex gap-2">
                               <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded-lg border border-emerald-100 flex items-center gap-1"><ShieldCheck size={10}/> Válido</span>
                               {doc.url && <button onClick={() => setViewingAttachment(doc.url!)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Eye size={20}/></button>}
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {modalTab === 'history' && (
                  <div className="space-y-8">
                    {/* Resumo de Custos Acumulados */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex items-center gap-4">
                          <div className="p-3 bg-white/10 rounded-2xl text-amber-500"><TrendingUp size={24}/></div>
                          <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Custo Acumulado</p><p className="text-xl font-black">€ {(vehicleStats.totalFuel + vehicleStats.totalMaint).toLocaleString('pt-PT', {minimumFractionDigits: 2})}</p></div>
                       </div>
                       <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-2xl text-blue-700"><Droplets size={24}/></div>
                          <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Combustível</p><p className="text-xl font-black text-slate-950">€ {vehicleStats.totalFuel.toLocaleString('pt-PT')}</p></div>
                       </div>
                       <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl flex items-center gap-4">
                          <div className="p-3 bg-purple-100 rounded-2xl text-purple-700"><Wrench size={24}/></div>
                          <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Oficina</p><p className="text-xl font-black text-slate-950">€ {vehicleStats.totalMaint.toLocaleString('pt-PT')}</p></div>
                       </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><HistoryIcon size={24} className="text-slate-400" /> Histórico Geral da Viatura</h4>
                      {isAdmin && (
                        <button onClick={() => setIsAddingItem(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black shadow-xl">
                           <Wrench size={16} className="text-amber-500"/> Registrar Manutenção
                        </button>
                      )}
                    </div>

                    {isAddingItem && (
                      <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-300 animate-fade-in space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="col-span-1 md:col-span-2"><label className="block text-[11px] font-black text-slate-950 uppercase mb-2">Serviço / Descrição Técnica</label><input type="text" className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-xl text-sm font-black outline-none focus:border-slate-900 text-slate-950" value={maintenanceForm.type} onChange={e => setMaintenanceForm({...maintenanceForm, type: e.target.value})} placeholder="Ex: Substituição de Pastilhas e Discos" /></div>
                           <div><label className="block text-[11px] font-black text-slate-950 uppercase mb-2">Custo do Serviço (€)</label><input type="number" step="0.01" className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-xl text-sm font-black outline-none text-slate-950" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({...maintenanceForm, cost: e.target.value})} /></div>
                           <div><label className="block text-[11px] font-black text-slate-950 uppercase mb-2">Data</label><input type="date" className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-xl text-sm font-black outline-none text-slate-950" value={maintenanceForm.date} onChange={e => setMaintenanceForm({...maintenanceForm, date: e.target.value})} /></div>
                           
                           <div className="col-span-2">
                              <label className="block text-[11px] font-black text-slate-950 uppercase mb-2">Nota Fiscal / Comprovante</label>
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${attachedFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white'}`}
                              >
                                <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                                {attachedFile ? <p className="text-xs font-black text-emerald-900 uppercase">{attachedFile.name}</p> : <p className="text-[10px] font-black text-slate-500 uppercase">Anexar NF (PDF ou JPG)</p>}
                              </div>
                           </div>

                           <div className="flex items-end col-span-2"><button onClick={handleAddItem} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg">Gravar Manutenção</button></div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                       {combinedHistory.length > 0 ? combinedHistory.map((event: any) => (
                         <div key={event.id} className={`p-6 rounded-[2rem] border-2 flex items-center justify-between group transition-all hover:shadow-md ${event.eventType === 'fuel' ? 'bg-blue-50/30 border-blue-100' : 'bg-purple-50/30 border-purple-100'}`}>
                            <div className="flex items-center gap-5">
                               <div className={`p-4 rounded-2xl shadow-sm ${event.eventType === 'fuel' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                                  {event.eventType === 'fuel' ? <Fuel size={20} /> : <Wrench size={20} />}
                               </div>
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{new Date(event.date).toLocaleDateString('pt-PT')}</span>
                                     <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${event.eventType === 'fuel' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>
                                        {event.eventType === 'fuel' ? 'Abastecimento' : 'Manutenção'}
                                     </span>
                                  </div>
                                  <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">
                                     {event.eventType === 'fuel' ? `${event.liters}L • ${event.km} KM` : event.type}
                                  </p>
                                  {event.description && <p className="text-[10px] text-slate-500 font-bold italic">{event.description}</p>}
                               </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-right">
                                  <p className={`text-lg font-black ${event.eventType === 'fuel' ? 'text-blue-900' : 'text-purple-900'}`}>€ {event.cost.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</p>
                               </div>
                               {event.receiptUrl && (
                                 <button onClick={() => setViewingAttachment(event.receiptUrl!)} className="p-3 bg-white border-2 border-slate-200 text-slate-900 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                                    <Eye size={18} />
                                 </button>
                               )}
                            </div>
                         </div>
                       )) : (
                         <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50">
                            <HistoryIcon size={48} className="mx-auto text-slate-200 mb-4 opacity-20" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Sem registros de histórico até o momento.</p>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {modalTab === 'fuel' && (
                  <div className="space-y-10 max-w-3xl mx-auto py-4">
                    <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex items-center gap-6 shadow-sm">
                       <div className="p-5 bg-blue-600 text-white rounded-3xl shadow-xl"><Droplets size={32}/></div>
                       <div><h4 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-1">Registro de Consumo</h4><p className="text-[10px] text-blue-800 font-bold uppercase tracking-widest">Mantenha os dados de KM precisos para controle de eficiência.</p></div>
                    </div>
                    
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Quilometragem no Ato</label>
                            <input type="number" className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none focus:border-slate-900" value={fuelForm.km} onChange={e => setFuelForm({...fuelForm, km: e.target.value})} placeholder="Ex: 45000" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Data do Abastecimento</label>
                            <input type="date" className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none" value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Litros Abastecidos</label>
                            <input type="number" step="0.01" className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: e.target.value})} placeholder="0.00" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Custo Total (€)</label>
                            <input type="number" step="0.01" className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-[1.5rem] text-sm font-black text-slate-950 outline-none" value={fuelForm.cost} onChange={e => setFuelForm({...fuelForm, cost: e.target.value})} placeholder="0.00" />
                          </div>
                          
                          <div className="col-span-2">
                             <label className="block text-[11px] font-black text-slate-950 uppercase mb-3 tracking-widest">Anexar Comprovante (NF)</label>
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${attachedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
                             >
                                <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                                {attachedFile ? (
                                  <div className="text-center">
                                    <Paperclip size={32} className="text-blue-600 mx-auto mb-2" />
                                    <p className="text-xs font-black text-blue-900 uppercase">{attachedFile.name}</p>
                                  </div>
                                ) : (
                                  <>
                                    <UploadCloud size={32} className="text-slate-300 mb-2" />
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Carregar Foto do Recibo</p>
                                  </>
                                )}
                             </div>
                          </div>
                       </div>
                       
                       <div className="pt-4">
                          <button onClick={handleAddItem} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-4 border border-amber-500/20">
                             <Save size={24} className="text-amber-500"/> Submeter Abastecimento
                          </button>
                       </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAÇÃO DE ANEXO */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4" onClick={() => setViewingAttachment(null)}>
           <div className="relative max-w-5xl max-h-[95vh] w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                   <FileText size={24} className="text-amber-500" />
                   <h4 className="font-black text-sm uppercase tracking-widest">Inspeção de Documento Digitalizado</h4>
                </div>
                <button onClick={() => setViewingAttachment(null)} className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-90"><X size={28}/></button>
              </div>
              <div className="p-4 flex items-center justify-center min-h-[500px] bg-slate-100 overflow-auto">
                 <img src={viewingAttachment} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" alt="Documento" />
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

export default FleetView;
