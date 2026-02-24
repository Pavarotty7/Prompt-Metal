
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Vehicle, VehicleDocument, MaintenanceRecord, UserRole, Attachment } from '../types';
import { driveService } from '../services/driveService';
import { uploadFile } from '../services/fileService';
import { 
  Truck, 
  Wrench, 
  Plus, 
  X, 
  Save, 
  Droplets, 
  DollarSign, 
  FileText, 
  UploadCloud, 
  Eye,
  Settings2,
  Gauge,
  CheckCircle2,
  History as HistoryIcon,
  TrendingUp,
  Zap,
  User,
  Calendar,
  ShieldAlert,
  Paperclip,
  Trash2,
  Files
} from 'lucide-react';

interface VehicleWithFuel extends Vehicle {
  fuelHistory?: Array<{
    id: string;
    date: string;
    km: number;
    liters: number;
    cost: number;
    receiptUrl?: string;
    receiptFileName?: string;
  }>;
}

interface FleetViewProps {
  vehicles: VehicleWithFuel[];
  onUpdateVehicles?: (vehicles: VehicleWithFuel[]) => void;
  userRole?: UserRole;
}

const FleetView: React.FC<FleetViewProps> = ({ vehicles, onUpdateVehicles, userRole }) => {
  const isAdmin = userRole === 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'history' | 'fuel' | 'documents'>('info'); 
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithFuel | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  
  // Forms State
  const [vehicleForm, setVehicleForm] = useState<Partial<VehicleWithFuel>>({
    model: '',
    plate: '',
    year: new Date().getFullYear(),
    currentKms: 0,
    driver: '',
    lastMaintenance: '',
    nextMaintenance: '',
    annualInspectionDate: '',
    status: 'Operacional'
  });

  const [fuelForm, setFuelForm] = useState<{
    vehicleId: string;
    date: string;
    km: string;
    liters: string;
    cost: string;
    receiptFiles: File[];
  }>({ 
    vehicleId: '', 
    date: new Date().toISOString().split('T')[0], 
    km: '', 
    liters: '', 
    cost: '',
    receiptFiles: []
  });

  const [docForm, setDocForm] = useState({
    name: '',
    files: [] as File[]
  });
  
  // Histórico com cálculo KM/L
  const combinedHistory = useMemo(() => {
    if (!editingVehicle) return [];
    const sortedFuel = [...(editingVehicle.fuelHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const fuelWithEff = sortedFuel.map((entry, idx) => {
      let efficiency = null;
      if (idx > 0) {
        const diff = entry.km - sortedFuel[idx - 1].km;
        if (diff > 0 && entry.liters > 0) efficiency = (diff / entry.liters).toFixed(2);
      }
      return { ...entry, type: 'fuel', efficiency };
    });

    const maint = (editingVehicle.maintenanceHistory || []).map(m => ({ ...m, type: 'maint' }));
    return [...fuelWithEff, ...maint].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [editingVehicle]);

  const handleOpenFuelModal = (vehicle?: VehicleWithFuel) => {
    setModalTab('fuel');
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFuelForm({ 
        vehicleId: vehicle.id, 
        date: new Date().toISOString().split('T')[0], 
        km: vehicle.currentKms.toString(), 
        liters: '', 
        cost: '',
        receiptFiles: [] 
      });
    } else {
      setEditingVehicle(null);
      setFuelForm({ 
        vehicleId: '', 
        date: new Date().toISOString().split('T')[0], 
        km: '', 
        liters: '', 
        cost: '',
        receiptFiles: []
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenNewVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      model: '',
      plate: '',
      year: new Date().getFullYear(),
      currentKms: 0,
      driver: '',
      lastMaintenance: '',
      nextMaintenance: '',
      annualInspectionDate: '',
      status: 'Operacional'
    });
    setModalTab('info');
    setIsModalOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: VehicleWithFuel) => {
    setEditingVehicle(vehicle);
    setVehicleForm({ ...vehicle });
    setModalTab('info');
    setIsModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateVehicles || !isAdmin) return;

    const vehicleToSave: VehicleWithFuel = {
      id: editingVehicle?.id || Math.random().toString(36).substr(2, 9),
      model: vehicleForm.model || '',
      plate: vehicleForm.plate?.toUpperCase() || '',
      year: Number(vehicleForm.year) || new Date().getFullYear(),
      currentKms: Number(vehicleForm.currentKms) || 0,
      driver: vehicleForm.driver || '',
      lastMaintenance: vehicleForm.lastMaintenance || '',
      nextMaintenance: vehicleForm.nextMaintenance || '',
      annualInspectionDate: vehicleForm.annualInspectionDate || '',
      status: vehicleForm.status as 'Operacional' | 'Manutenção',
      fuelHistory: editingVehicle?.fuelHistory || [],
      maintenanceHistory: editingVehicle?.maintenanceHistory || [],
      documents: editingVehicle?.documents || []
    };

    const updatedVehicles = editingVehicle 
      ? vehicles.map(v => v.id === editingVehicle.id ? vehicleToSave : v)
      : [vehicleToSave, ...vehicles];

    onUpdateVehicles(updatedVehicles);
    setIsModalOpen(false);
  };

  const handleAddFuel = async () => {
    if (!onUpdateVehicles) return;
    const target = editingVehicle || vehicles.find(v => v.id === fuelForm.vehicleId);
    if (!target) return;

    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of fuelForm.receiptFiles) {
        const url = await uploadFile(file);
        newAttachments.push({ name: file.name, url });
      }

      const newLog = { 
        id: Math.random().toString(36).substr(2, 9), 
        date: fuelForm.date, 
        km: Number(fuelForm.km), 
        liters: Number(fuelForm.liters), 
        cost: Number(fuelForm.cost),
        receiptUrl: newAttachments.length > 0 ? newAttachments[0].url : undefined,
        receiptFileName: newAttachments.length > 0 ? newAttachments[0].name : undefined,
        attachments: newAttachments
      };

      const updated = { 
        ...target, 
        fuelHistory: [newLog, ...(target.fuelHistory || [])], 
        currentKms: Math.max(target.currentKms, Number(fuelForm.km)) 
      };
      
      onUpdateVehicles(vehicles.map(v => v.id === updated.id ? updated : v));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error uploading fuel receipts:', error);
      alert('Erro ao carregar recibos. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateVehicles || !editingVehicle || docForm.files.length === 0 || !docForm.name) return;

    const currentDocs = editingVehicle.documents || [];
    if (currentDocs.length >= 10) {
      alert("Limite de 10 documentos por veículo atingido.");
      return;
    }

    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of docForm.files) {
        const url = await uploadFile(file);
        newAttachments.push({ name: file.name, url });
      }

      const newDoc: VehicleDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: docForm.name,
        type: 'Outros',
        uploadDate: new Date().toISOString().split('T')[0],
        url: newAttachments[0].url,
        fileName: newAttachments[0].name,
        attachments: newAttachments
      };

      const updatedVehicle = {
        ...editingVehicle,
        documents: [...currentDocs, newDoc]
      };

      onUpdateVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
      setEditingVehicle(updatedVehicle);
      setDocForm({ name: '', files: [] });
    } catch (error) {
      console.error('Error uploading vehicle document:', error);
      alert('Erro ao carregar documento. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (!onUpdateVehicles || !editingVehicle || !isAdmin) return;
    
    const updatedVehicle = {
      ...editingVehicle,
      documents: (editingVehicle.documents || []).filter(d => d.id !== docId)
    };

    onUpdateVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    setEditingVehicle(updatedVehicle);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Frota Ativa</h2>
          <p className="text-slate-600 font-medium">Gestão de ativos e eficiência energética</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button onClick={() => handleOpenFuelModal()} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl flex items-center gap-2 transition-all active:scale-95 border border-white/10">
              <Droplets size={18} /> Abastecimento
            </button>
            <button onClick={handleOpenNewVehicle} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl flex items-center gap-3 transition-all active:scale-95 border border-amber-500/30">
              <Plus size={18} className="text-amber-500" /> Nova Viatura
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 flex flex-col justify-between min-h-[350px] group hover:border-slate-900 transition-all">
            <div>
              <div className="flex justify-between mb-6">
                <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:bg-amber-500 transition-colors"><Truck size={32} /></div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border h-fit ${vehicle.status === 'Operacional' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{vehicle.status}</span>
                </div>
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-black text-slate-900 uppercase">{vehicle.model}</h3>
                <button onClick={() => handleOpenEditVehicle(vehicle)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <Settings2 size={18} />
                </button>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border inline-block mb-4">{vehicle.plate}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <User size={14} className="text-slate-400" />
                  <span>Condutor: <span className="font-black text-slate-900 uppercase">{vehicle.driver || 'Não Atribuído'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Gauge size={14} className="text-slate-400" />
                  <span>Quilometragem: <span className="font-black text-slate-900">{vehicle.currentKms.toLocaleString()} km</span></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Próxima Revisão</p>
                  <p className="text-[10px] font-black text-slate-900">{vehicle.nextMaintenance ? new Date(vehicle.nextMaintenance).toLocaleDateString('pt-PT') : 'N/D'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Inspeção (IPO)</p>
                  <p className="text-[10px] font-black text-slate-900">{vehicle.annualInspectionDate ? new Date(vehicle.annualInspectionDate).toLocaleDateString('pt-PT') : 'N/D'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={() => handleOpenFuelModal(vehicle)} className="py-3 bg-emerald-50 text-emerald-800 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100">Abastecer</button>
              <button onClick={() => { setEditingVehicle(vehicle); setModalTab('history'); setIsModalOpen(true); }} className="py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-black transition-all shadow-lg">Histórico</button>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
            <Truck size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest">Nenhuma viatura cadastrada</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[95vh]">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white shrink-0">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                {modalTab === 'fuel' ? <Droplets className="text-emerald-500" /> : modalTab === 'documents' ? <Files className="text-blue-500" /> : <Truck className="text-amber-500" />}
                {modalTab === 'fuel' ? 'Registrar Abastecimento' : modalTab === 'documents' ? 'Documentos do Veículo' : editingVehicle ? 'Editar Viatura' : 'Nova Viatura'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X /></button>
            </div>
            
            <div className="p-2 bg-slate-100 flex gap-2 shrink-0">
              {(['info', 'history', 'fuel', 'documents'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => {
                    if (!editingVehicle && (tab === 'history' || tab === 'documents')) return;
                    setModalTab(tab);
                  }} 
                  disabled={!editingVehicle && (tab === 'history' || tab === 'documents')}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!editingVehicle && (tab === 'history' || tab === 'documents') ? 'opacity-30 cursor-not-allowed' : ''} ${modalTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab === 'info' ? 'Dados Gerais' : tab === 'history' ? 'Histórico' : tab === 'fuel' ? 'Abastecimento' : 'Documentos'}
                </button>
              ))}
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {modalTab === 'info' && (
                <form onSubmit={handleSaveVehicle} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Modelo / Marca</label>
                      <div className="relative">
                        <Truck size={16} className="absolute left-4 top-4 text-slate-400" />
                        <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} placeholder="Ex: Mercedes Sprinter" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Matrícula</label>
                      <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900 uppercase" value={vehicleForm.plate} onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value})} placeholder="AA-00-BB" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Ano de Fabrico</label>
                      <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Quilometragem (KM)</label>
                      <div className="relative">
                        <Gauge size={16} className="absolute left-4 top-4 text-slate-400" />
                        <input required type="number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900" value={vehicleForm.currentKms} onChange={e => setVehicleForm({...vehicleForm, currentKms: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Condutor Habitual</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-4 text-slate-400" />
                        <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900" value={vehicleForm.driver} onChange={e => setVehicleForm({...vehicleForm, driver: e.target.value})} placeholder="Nome do Condutor" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Última Revisão</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900" value={vehicleForm.lastMaintenance} onChange={e => setVehicleForm({...vehicleForm, lastMaintenance: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Próxima Revisão</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900" value={vehicleForm.nextMaintenance} onChange={e => setVehicleForm({...vehicleForm, nextMaintenance: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Data Inspeção (IPO)</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900" value={vehicleForm.annualInspectionDate} onChange={e => setVehicleForm({...vehicleForm, annualInspectionDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Status</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-slate-900 outline-none" value={vehicleForm.status} onChange={e => setVehicleForm({...vehicleForm, status: e.target.value as any})}>
                        <option value="Operacional">Operacional</option>
                        <option value="Manutenção">Em Manutenção</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black shadow-xl flex items-center justify-center gap-3">
                      <Save size={20} className="text-amber-500" /> {editingVehicle ? 'Atualizar Dados' : 'Cadastrar Viatura'}
                    </button>
                  </div>
                </form>
              )}

              {modalTab === 'fuel' && (
                <div className="space-y-8">
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20"><Droplets size={24} /></div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950 uppercase">Lançamento de Combustível</h4>
                      <p className="text-[10px] font-medium text-emerald-800 italic leading-none mt-1">Os cálculos de consumo (KM/L) serão automáticos no histórico.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {!editingVehicle && (
                      <div className="animate-fade-in">
                        <label className="block text-[11px] font-black uppercase mb-2 text-slate-950 tracking-widest">Selecionar Viatura</label>
                        <select className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm text-slate-900 focus:border-emerald-500 outline-none appearance-none" value={fuelForm.vehicleId} onChange={e => setFuelForm({...fuelForm, vehicleId: e.target.value})}>
                          <option value="">Escolha a Viatura...</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}
                        </select>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="animate-fade-in">
                        <label className="block text-[11px] font-black uppercase mb-2 text-slate-950 tracking-widest">Odômetro (KM)</label>
                        <div className="relative">
                          <Gauge size={18} className="absolute left-4 top-4 text-emerald-600" />
                          <input type="number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-lg text-slate-900 focus:border-emerald-500 outline-none" value={fuelForm.km} onChange={e => setFuelForm({...fuelForm, km: e.target.value})} placeholder="0" />
                        </div>
                      </div>
                      <div className="animate-fade-in">
                        <label className="block text-[11px] font-black uppercase mb-2 text-slate-950 tracking-widest">Volume (Litros)</label>
                        <div className="relative">
                          <Droplets size={18} className="absolute left-4 top-4 text-emerald-600" />
                          <input type="number" step="0.01" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-lg text-slate-900 focus:border-emerald-500 outline-none" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: e.target.value})} placeholder="0.00" />
                        </div>
                      </div>
                      <div className="animate-fade-in">
                        <label className="block text-[11px] font-black uppercase mb-2 text-slate-950 tracking-widest">Custo Total (€)</label>
                        <div className="relative">
                          <DollarSign size={18} className="absolute left-4 top-4 text-emerald-600" />
                          <input type="number" step="0.01" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-lg text-emerald-900 focus:border-emerald-500 outline-none" value={fuelForm.cost} onChange={e => setFuelForm({...fuelForm, cost: e.target.value})} placeholder="0.00" />
                        </div>
                      </div>
                      <div className="animate-fade-in">
                        <label className="block text-[11px] font-black uppercase mb-2 text-slate-950 tracking-widest">Data do Recibo</label>
                        <div className="relative">
                          <Calendar size={18} className="absolute left-4 top-4 text-emerald-600 pointer-events-none" />
                          <input type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-emerald-500 outline-none" value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="animate-fade-in">
                      <label className="block text-[11px] font-black uppercase mb-2 text-slate-950 tracking-widest">Anexar Faturas / Recibos (Múltiplos)</label>
                      <div 
                        className="border-2 border-dashed border-slate-300 rounded-[2rem] p-8 bg-slate-50 relative group flex flex-col items-center justify-center transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          multiple
                          ref={fileInputRef}
                          className="hidden" 
                          onChange={e => setFuelForm({...fuelForm, receiptFiles: Array.from(e.target.files || [])})}
                        />
                        <UploadCloud size={40} className="text-slate-400 group-hover:text-emerald-600 mb-2 transition-all" />
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover:text-emerald-700">
                          {fuelForm.receiptFiles.length > 0 
                            ? `${fuelForm.receiptFiles.length} arquivos selecionados` 
                            : 'Clique para selecionar arquivos'}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">PDF, JPG ou PNG</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100">
                    <button 
                      onClick={handleAddFuel} 
                      disabled={isUploading || !fuelForm.km || !fuelForm.liters || !fuelForm.cost || (!editingVehicle && !fuelForm.vehicleId)}
                      className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        <>
                          <CheckCircle2 size={24} /> Confirmar Lançamento
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {modalTab === 'history' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Gasto (Frota)</p>
                      <p className="text-xl font-black">€ {combinedHistory.reduce((acc, curr) => acc + curr.cost, 0).toLocaleString('pt-PT')}</p>
                    </div>
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl shadow-sm">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Último Consumo</p>
                      <p className="text-xl font-black text-emerald-600">{(combinedHistory as any[]).find(h => h.type === 'fuel' && h.efficiency)?.efficiency || '0.00'} <span className="text-[10px]">KM/L</span></p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {combinedHistory.length > 0 ? combinedHistory.map((log: any) => (
                      <div key={log.id} className={`p-6 border rounded-3xl flex justify-between items-center transition-all hover:shadow-md ${log.type === 'fuel' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-blue-50/30 border-blue-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${log.type === 'fuel' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                            {log.type === 'fuel' ? <Droplets size={18} /> : <Wrench size={18} />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">{new Date(log.date).toLocaleDateString('pt-PT')}</p>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                              {log.type === 'fuel' ? `${log.liters} Litros • ${log.km.toLocaleString()} km` : log.type}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {log.efficiency && <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Zap size={10} /> {log.efficiency} KM/L</span>}
                              {(log.receiptUrl || (log.attachments && log.attachments.length > 0)) && <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Paperclip size={10} /> Documentado</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-lg font-black ${log.type === 'fuel' ? 'text-emerald-700' : 'text-blue-700'}`}>€ {log.cost.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</p>
                          </div>
                          <div className="flex gap-1">
                            {(log.attachments || []).map((att: any, idx: number) => (
                              <button 
                                key={idx}
                                onClick={() => setViewingReceipt(att.url)}
                                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                title={att.name}
                              >
                                <Paperclip size={18} />
                              </button>
                            ))}
                            {!log.attachments && log.receiptUrl && (
                              <button 
                                onClick={() => setViewingReceipt(log.receiptUrl)}
                                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              >
                                <Eye size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <HistoryIcon size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 uppercase font-black text-[10px] tracking-widest">Sem registros no histórico</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalTab === 'documents' && editingVehicle && (
                <div className="space-y-8 animate-fade-in">
                  <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20"><Files size={24} /></div>
                    <div>
                      <h4 className="text-sm font-black text-blue-950 uppercase">Arquivo de Documentação</h4>
                      <p className="text-[10px] font-medium text-blue-800 italic leading-none mt-1">Gerencie até 10 documentos por veículo (Certificados, Seguros, etc.)</p>
                    </div>
                  </div>

                  {isAdmin && (editingVehicle.documents?.length || 0) < 10 && (
                    <form onSubmit={handleAddDocument} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Nome do Documento</label>
                          <input 
                            required 
                            type="text" 
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-black text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-600" 
                            placeholder="Ex: Carta de Condução, Seguro 2024"
                            value={docForm.name}
                            onChange={e => setDocForm({...docForm, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase mb-2 text-slate-950 tracking-widest">Anexos (Múltiplos)</label>
                          <div 
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-black text-xs text-slate-500 cursor-pointer flex items-center justify-between"
                            onClick={() => docFileInputRef.current?.click()}
                          >
                            <span className="truncate">{docForm.files.length > 0 ? `${docForm.files.length} arquivos` : 'Selecionar Arquivos'}</span>
                            <UploadCloud size={16} />
                            <input 
                              type="file" 
                              multiple
                              ref={docFileInputRef}
                              className="hidden" 
                              onChange={e => setDocForm({...docForm, files: Array.from(e.target.files || [])})}
                            />
                          </div>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={isUploading || !docForm.name || docForm.files.length === 0}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isUploading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Enviando...</span>
                          </div>
                        ) : (
                          <>
                            <Plus size={16} /> Adicionar Documento
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editingVehicle.documents?.map(doc => (
                      <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-blue-600 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={18} /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-950 uppercase tracking-tight leading-none mb-1">{doc.name}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">Subido em {new Date(doc.uploadDate).toLocaleDateString('pt-PT')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(doc.attachments || []).map((att, idx) => (
                            <button 
                              key={idx}
                              onClick={() => setViewingReceipt(att.url)}
                              className="p-2 text-slate-400 hover:text-blue-600 transition-all"
                              title={att.name}
                            >
                              <Paperclip size={16} />
                            </button>
                          ))}
                          {!doc.attachments && doc.url && (
                            <button 
                              onClick={() => setViewingReceipt(doc.url || '')}
                              className="p-2 text-slate-400 hover:text-blue-600 transition-all"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(editingVehicle.documents?.length || 0) === 0 && (
                      <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <Files size={40} className="mx-auto text-slate-200 mb-4 opacity-50" />
                        <p className="text-slate-400 uppercase font-black text-[9px] tracking-widest">Nenhum documento arquivado</p>
                      </div>
                    )}
                  </div>
                  
                  {editingVehicle.documents && editingVehicle.documents.length >= 10 && (
                    <p className="text-center text-[10px] font-black text-amber-600 uppercase tracking-widest animate-pulse">
                      Limite de 10 documentos atingido
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAÇÃO DE COMPROVANTE */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4" onClick={() => setViewingReceipt(null)}>
           <div className="relative max-w-5xl max-h-[95vh] w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                   <FileText size={24} className="text-emerald-500" />
                   <h4 className="font-black text-sm uppercase tracking-widest">Visualização de Documento</h4>
                </div>
                <button onClick={() => setViewingReceipt(null)} className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-90"><X size={28}/></button>
              </div>
              <div className="p-4 flex items-center justify-center min-h-[500px] bg-slate-100 overflow-auto">
                 <img src={viewingReceipt} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" alt="Documento" />
              </div>
              <div className="bg-white p-6 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setViewingReceipt(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Fechar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FleetView;
