
import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckSquare, Plus, X, Save, Calendar, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { UserRole, ChecklistItem } from '../types';

interface ComplianceViewProps {
  userRole?: UserRole;
  items: ChecklistItem[];
  onSetItems: (items: ChecklistItem[]) => void;
}

const ComplianceView: React.FC<ComplianceViewProps> = ({ userRole, items, onSetItems }) => {
  const isAdmin = userRole === 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ text: '', critical: false, deadline: '' });

  const toggleCheck = (id: string) => {
    if (!isAdmin) return;
    onSetItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const item: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newItem.text,
      checked: false,
      critical: newItem.critical,
      deadline: newItem.deadline
    };
    onSetItems([...items, item]);
    setIsModalOpen(false);
    setNewItem({ text: '', critical: false, deadline: '' });
  };

  const handleDeleteItem = () => {
    if (itemToDelete !== null) {
      onSetItems(items.filter(i => i.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Compliance & Qualidade</h2>
          <p className="text-slate-500 font-medium italic">Documentação obrigatória e auditoria de padrões da marca</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
           <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 uppercase tracking-widest">
             <Shield size={18} className="text-emerald-600"/> Checklist de Conformidade
           </h3>
        </div>
        <div className="divide-y divide-slate-100">
           {items.map(item => (
             <div 
               key={item.id} 
               onClick={() => toggleCheck(item.id)}
               className={`p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group ${item.checked ? 'opacity-60' : ''} ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
             >
               <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20' : 'border-slate-200 bg-white'}`}>
                 {item.checked && <CheckCircle2 size={20} className="text-white" />}
               </div>
               <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className={`text-sm font-black uppercase tracking-tight ${item.checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.text}</p>
                        <div className="flex items-center gap-3 mt-1">
                            {item.critical && <span className="text-[8px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest border border-red-100">Crítico</span>}
                            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                <Calendar size={12} className="text-black" /> Vencimento: {new Date(item.deadline).toLocaleDateString('pt-PT')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                 </div>
               </div>
             </div>
           ))}
           {items.length === 0 && (
               <div className="py-20 text-center">
                   <Shield size={48} className="mx-auto text-slate-100 mb-4" />
                   <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Nenhum item de auditoria</p>
               </div>
           )}
        </div>
        {isAdmin && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
             <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl active:scale-95 transition-all">
               <Plus size={16} className="text-amber-500" /> Adicionar Requisito
             </button>
          </div>
        )}
      </div>

      {/* MODAL: ADICIONAR ITEM */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-scale-in">
              <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Shield size={24} className="text-emerald-500" /> Novo Requisito</h3>
                 <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddItem} className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Descrição do Requisito / Documento</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black outline-none focus:ring-2 focus:ring-slate-800" 
                        placeholder="Ex: Certificado de Carga do Pavimento"
                        value={newItem.text}
                        onChange={e => setNewItem({...newItem, text: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Data Limite / Renovação</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-4 text-black" size={18} />
                        <input 
                            type="date" 
                            required 
                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black outline-none"
                            value={newItem.deadline}
                            onChange={e => setNewItem({...newItem, deadline: e.target.value})}
                        />
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <input 
                        type="checkbox" 
                        id="critical" 
                        className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                        checked={newItem.critical}
                        onChange={e => setNewItem({...newItem, critical: e.target.checked})}
                    />
                    <label htmlFor="critical" className="text-[10px] font-black text-black uppercase tracking-widest cursor-pointer select-none">Este item é Crítico (Impede Operação)</label>
                 </div>
                 <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl">Cancelar</button>
                    <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all">Salvar no Checklist</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32}/></div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Remover Item?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed italic">Deseja excluir este requisito do checklist de conformidade?</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setItemToDelete(null)} className="py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl">Manter</button>
                 <button onClick={handleDeleteItem} className="py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all">Excluir</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceView;
