
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, CorporateCardTransaction, UserRole } from '../types';
import { MOCK_CARD_TRANSACTIONS } from '../constants';
import { 
  CreditCard, Plus, FileText, CheckCircle2, X, Save, Paperclip, 
  Edit, UploadCloud, UserPlus, Image as ImageIcon, AlertTriangle, 
  Search, Trash2, ChevronRight, Settings, Eye, Filter, Coins, Calendar,
  ShieldCheck, ArrowUpRight, History, Info
} from 'lucide-react';

interface CorporateCardViewProps {
  employees: Employee[];
  onUpdateEmployee?: (employee: Employee) => void;
  userRole?: UserRole;
}

const CorporateCardView: React.FC<CorporateCardViewProps> = ({ employees, onUpdateEmployee, userRole }) => {
  const isAdmin = userRole === 'admin';
  
  const cardHolders = useMemo(() => employees.filter(e => e.hasCorporateCard), [employees]);
  const nonCardHolders = useMemo(() => employees.filter(e => !e.hasCorporateCard), [employees]);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(cardHolders[0]?.id || '');
  const [transactions, setTransactions] = useState<CorporateCardTransaction[]>(MOCK_CARD_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [isNewHolderModalOpen, setIsNewHolderModalOpen] = useState(false);
  const [isManageHoldersModalOpen, setIsManageHoldersModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<{empId: string, name: string} | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Forms
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [txFormData, setTxFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Alimentação',
    amount: '',
  });

  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardFormData, setCardFormData] = useState({
    cardLimit: 0,
    cardLast4: '',
    cardExpiry: '',
    employeeId: '',
    name: ''
  });

  const selectedEmployee = useMemo(() => cardHolders.find(e => e.id === selectedEmployeeId), [cardHolders, selectedEmployeeId]);
  const employeeTransactions = useMemo(() => transactions.filter(t => t.employeeId === selectedEmployeeId), [transactions, selectedEmployeeId]);

  const stats = useMemo(() => {
    const spent = employeeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const limit = selectedEmployee?.cardLimit || 0;
    return { 
      spent, 
      limit, 
      available: limit - spent, 
      utilization: limit > 0 ? (spent / limit) * 100 : 0 
    };
  }, [employeeTransactions, selectedEmployee]);

  const filteredCardHolders = useMemo(() => cardHolders.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.cardLast4?.includes(searchQuery)
  ), [cardHolders, searchQuery]);

  const formatCardExpiry = (dateStr?: string) => {
    if (!dateStr) return '00/00';
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(2)}`;
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedEmployeeId) return;
    const newTx: CorporateCardTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: selectedEmployeeId,
      date: txFormData.date,
      description: txFormData.description,
      amount: parseFloat(txFormData.amount),
      category: txFormData.category,
      status: 'Pendente',
      receiptAttached: !!receiptFile,
      receiptFileName: receiptFile?.name,
      receiptUrl: receiptFile ? URL.createObjectURL(receiptFile) : undefined
    };
    setTransactions(prev => [newTx, ...prev]);
    setIsTransactionModalOpen(false);
    setReceiptFile(null);
    setTxFormData({ ...txFormData, description: '', amount: '' });
  };

  const handleAddNewHolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !onUpdateEmployee) return;
    const target = employees.find(emp => emp.id === cardFormData.employeeId);
    if (target) {
      onUpdateEmployee({
        ...target,
        hasCorporateCard: true,
        cardLimit: Number(cardFormData.cardLimit),
        cardLast4: cardFormData.cardLast4,
        cardExpiry: cardFormData.cardExpiry,
        cardImage: cardImageFile ? URL.createObjectURL(cardImageFile) : undefined
      });
      setIsNewHolderModalOpen(false);
      setSelectedEmployeeId(target.id);
      setCardImageFile(null);
    }
  };

  const handleUpdateHolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !onUpdateEmployee) return;
    const target = employees.find(emp => emp.id === cardFormData.employeeId);
    if (target) {
      onUpdateEmployee({
        ...target,
        cardLimit: Number(cardFormData.cardLimit),
        cardLast4: cardFormData.cardLast4,
        cardExpiry: cardFormData.cardExpiry,
        cardImage: cardImageFile ? URL.createObjectURL(cardImageFile) : target.cardImage
      });
      setIsEditCardModalOpen(false);
      setCardImageFile(null);
    }
  };

  const handleRevokeCard = (empId: string) => {
    if (!isAdmin || !onUpdateEmployee) return;
    const target = employees.find(emp => emp.id === empId);
    if (target) {
      onUpdateEmployee({
        ...target,
        hasCorporateCard: false,
        cardLimit: undefined,
        cardLast4: undefined,
        cardExpiry: undefined,
        cardImage: undefined
      });
      setIsDeleteConfirmOpen(null);
      if (selectedEmployeeId === empId) setSelectedEmployeeId(cardHolders.filter(h => h.id !== empId)[0]?.id || '');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestão de Cartões Corporativos</h2>
          <p className="text-slate-500 font-medium italic">Controle de limites e conformidade de despesas de campo</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button 
                onClick={() => setIsManageHoldersModalOpen(true)} 
                className="bg-white border border-slate-300 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
            >
                <Settings size={16} className="text-black" /> Gerenciar Portadores
            </button>
            <button 
                onClick={() => {
                    setCardFormData({ cardLimit: 1000, cardLast4: '', cardExpiry: '', employeeId: '', name: '' });
                    setIsNewHolderModalOpen(true);
                }} 
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 shadow-xl active:scale-95 transition-all"
            >
                <UserPlus size={16} className="text-amber-500" /> Novo Portador
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Listagem de Portadores */}
        <div className="lg:col-span-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-fit overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100">
             <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2 mb-4"><CreditCard size={18} className="text-black" /> Portadores Ativos</h3>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-black" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar portador..." 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-slate-800 transition-all text-black" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
             </div>
          </div>
          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[500px]">
             {filteredCardHolders.map(emp => (
               <div 
                 key={emp.id} 
                 onClick={() => setSelectedEmployeeId(emp.id)} 
                 className={`p-5 cursor-pointer transition-all flex items-center justify-between border-l-4 ${selectedEmployeeId === emp.id ? 'bg-slate-900 border-amber-500 text-white shadow-xl' : 'border-transparent hover:bg-slate-50'}`}
               >
                  <div>
                    <p className="font-black text-xs uppercase tracking-tight">{emp.name}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${selectedEmployeeId === emp.id ? 'text-slate-400' : 'text-slate-500'}`}>{emp.role}</p>
                  </div>
                  <ChevronRight size={14} className={selectedEmployeeId === emp.id ? 'text-amber-500' : 'text-slate-300'} />
               </div>
             ))}
             {filteredCardHolders.length === 0 && (
                 <div className="p-12 text-center text-slate-300 text-[10px] font-black uppercase italic tracking-widest leading-relaxed">Nenhum portador<br/>ativo encontrado.</div>
             )}
          </div>
        </div>

        {/* Painel de Controle Principal */}
        <div className="lg:col-span-3 space-y-6">
          {selectedEmployee ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Cartão Visual */}
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                      <div className="relative z-10 h-full flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                            <CreditCard size={32} className="text-amber-500" />
                            <div className="flex gap-2">
                                {selectedEmployee.cardImage && (
                                  <button onClick={() => setViewingReceipt(selectedEmployee.cardImage!)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all" title="Ver Cópia do Cartão">
                                    <Eye size={16} />
                                  </button>
                                )}
                                {isAdmin && (
                                    <button 
                                        onClick={() => { 
                                            setCardFormData({ 
                                                cardLimit: selectedEmployee.cardLimit || 0, 
                                                cardLast4: selectedEmployee.cardLast4 || '', 
                                                cardExpiry: selectedEmployee.cardExpiry || '', 
                                                employeeId: selectedEmployee.id, 
                                                name: selectedEmployee.name 
                                            }); 
                                            setIsEditCardModalOpen(true); 
                                        }} 
                                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="mt-8">
                            <p className="font-mono text-xl tracking-[0.2em] text-white">•••• •••• •••• {selectedEmployee.cardLast4}</p>
                            <div className="flex justify-between items-end mt-6">
                                <div>
                                    <p className="text-[8px] tracking-[0.3em] text-slate-500 uppercase font-black mb-1">VALID THRU</p>
                                    <p className="font-mono text-xs">{formatCardExpiry(selectedEmployee.cardExpiry)}</p>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest border-b border-amber-500/50 pb-1">{selectedEmployee.name}</p>
                            </div>
                        </div>
                      </div>
                  </div>
                  
                  {/* Stats Consumo */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center shadow-sm relative group hover:shadow-xl transition-all">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Limite do Mês</p>
                      <h3 className="text-3xl font-black text-black leading-none mb-4">€ {stats.limit.toLocaleString('pt-PT')}</h3>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${stats.utilization > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{width: `${Math.min(stats.utilization, 100)}%`}}
                          />
                      </div>
                      <div className="flex justify-between mt-2">
                         <span className="text-[9px] font-black text-black uppercase tracking-widest">{stats.utilization.toFixed(1)}% Usado</span>
                         <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Saldo: € {stats.available.toLocaleString('pt-PT')}</span>
                      </div>
                  </div>

                  {/* Lançamento Rápido / Inspeção */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center shadow-sm group hover:border-slate-800 transition-all">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Status de Auditoria</p>
                      <div className="flex items-center gap-2 mb-6">
                         <ShieldCheck className="text-emerald-500" size={20} />
                         <span className="text-xs font-black text-black uppercase tracking-tight">Vincular Recibos</span>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => setIsTransactionModalOpen(true)} 
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                          <Plus size={18} className="text-amber-500"/> Lançar Despesa
                        </button>
                      )}
                  </div>
              </div>

              {/* Extrato Detalhado com Inspeção de Documentos */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                 <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                        <FileText size={18} className="text-black" /> Inspeção de Lançamentos
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-[8px] font-black text-black uppercase tracking-widest">Documentado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="text-[8px] font-black text-black uppercase tracking-widest">Pendente Recibo</span>
                        </div>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="py-4 px-6 text-[9px] font-black uppercase text-black tracking-widest">Data</th>
                            <th className="py-4 px-6 text-[9px] font-black uppercase text-black tracking-widest">Descrição</th>
                            <th className="py-4 px-6 text-[9px] font-black uppercase text-black tracking-widest">Categoria</th>
                            <th className="py-4 px-6 text-[9px] font-black uppercase text-black tracking-widest text-center">Conformidade</th>
                            <th className="py-4 px-6 text-[9px] font-black uppercase text-black tracking-widest text-right">Valor (€)</th>
                            <th className="py-4 px-6 text-[9px] font-black uppercase text-black tracking-widest text-center">Documento</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {employeeTransactions.length > 0 ? employeeTransactions.map(tx => (
                         <tr key={tx.id} className="hover:bg-slate-50 transition-all group">
                            <td className="py-4 px-6 text-xs text-black font-black uppercase">
                                {new Date(tx.date).toLocaleDateString('pt-PT')}
                            </td>
                            <td className="py-4 px-6 text-sm font-black text-black uppercase tracking-tight">
                                {tx.description}
                            </td>
                            <td className="py-4 px-6">
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-black uppercase tracking-widest border border-slate-200">
                                    {tx.category}
                                </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                    tx.receiptAttached ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                    {tx.receiptAttached ? 'Comprovado' : 'Sem Recibo'}
                                </span>
                            </td>
                            <td className="py-4 px-6 text-sm font-black text-right text-black">
                                {tx.amount.toLocaleString('pt-PT', {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-4 px-6 text-center">
                                {tx.receiptAttached ? (
                                    <button 
                                        onClick={() => setViewingReceipt(tx.receiptUrl || '')} 
                                        className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg"
                                        title="Ver Comprovante"
                                    >
                                        <Paperclip size={14} />
                                    </button>
                                ) : (
                                    <div className="p-2 text-slate-200"><X size={14} /></div>
                                )}
                            </td>
                         </tr>
                       )) : (
                           <tr>
                               <td colSpan={6} className="py-24 text-center text-slate-300 text-[10px] font-black uppercase italic tracking-[0.2em]">Nenhum lançamento para este período.</td>
                           </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-24 text-center">
                <CreditCard size={64} className="mb-6 opacity-10" />
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter">Nenhum Portador Selecionado</h3>
                <p className="text-xs font-medium max-w-xs mx-auto mt-2 italic leading-relaxed">Selecione um colaborador na lista ao lado para gerenciar seus gastos e limites corporativos.</p>
                {isAdmin && (
                    <button 
                        onClick={() => setIsNewHolderModalOpen(true)}
                        className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                    >
                        + Cadastrar Novo Portador
                    </button>
                )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NOVO PORTADOR / ATIVAR PORTADOR */}
      {isNewHolderModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-scale-in">
              <div className="bg-slate-900 p-8 flex justify-between items-center">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><UserPlus size={24} className="text-amber-500" /> Ativar Portador</h3>
                 <button onClick={() => setIsNewHolderModalOpen(false)} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddNewHolder} className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Selecionar Funcionário</label>
                    <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:ring-2 focus:ring-slate-800 text-black" value={cardFormData.employeeId} onChange={e => setCardFormData({...cardFormData, employeeId: e.target.value})}>
                        <option value="">Escolher colaborador...</option>
                        {nonCardHolders.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Limite Mensal (€)</label>
                       <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-emerald-600 outline-none" value={cardFormData.cardLimit} onChange={e => setCardFormData({...cardFormData, cardLimit: Number(e.target.value)})} />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Final do Cartão (4 Dígitos)</label>
                       <input type="text" maxLength={4} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none text-black" value={cardFormData.cardLast4} onChange={e => setCardFormData({...cardFormData, cardLast4: e.target.value})} placeholder="0000" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Data de Validade</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3 text-black" size={18} />
                      <input type="date" required className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none text-black" value={cardFormData.cardExpiry} onChange={e => setCardFormData({...cardFormData, cardExpiry: e.target.value})} />
                    </div>
                 </div>
                 <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsNewHolderModalOpen(false)} className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                    <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all">Ativar Cartão</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: LANÇAR TRANSAÇÃO */}
      {isTransactionModalOpen && isAdmin && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-scale-in">
              <div className="bg-slate-900 p-8 flex justify-between items-center">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Coins size={24} className="text-amber-500" /> Nova Despesa</h3>
                 <button onClick={() => setIsTransactionModalOpen(false)} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveTransaction} className="p-8 space-y-6">
                 <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black uppercase border border-white/10">{selectedEmployee.name.substring(0,2)}</div>
                    <div><p className="text-[10px] font-black text-black uppercase tracking-widest">Portador Selecionado</p><p className="font-black text-sm text-black uppercase tracking-tight">{selectedEmployee.name}</p></div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Descrição da Compra</label>
                    <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:ring-2 focus:ring-slate-800 text-black" placeholder="Ex: Refeição Almoço Equipe" value={txFormData.description} onChange={e => setTxFormData({...txFormData, description: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Valor Bruto (€)</label>
                       <input type="number" step="0.01" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-red-600 outline-none" value={txFormData.amount} onChange={e => setTxFormData({...txFormData, amount: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Categoria</label>
                       <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none text-black" value={txFormData.category} onChange={e => setTxFormData({...txFormData, category: e.target.value})}>
                          <option value="Alimentação">Alimentação</option>
                          <option value="Combustível">Combustível</option>
                          <option value="Ferramentas">Ferramentas</option>
                          <option value="Suprimentos">Suprimentos</option>
                          <option value="Outros">Outros</option>
                       </select>
                    </div>
                 </div>
                 <div className="col-span-2">
                    <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Data da Operação</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3 text-black" size={18} />
                      <input type="date" required className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none text-black" value={txFormData.date} onChange={e => setTxFormData({...txFormData, date: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest">Upload de Fatura/Recibo</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 relative group flex flex-col items-center justify-center">
                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                       <UploadCloud size={24} className="text-black group-hover:text-slate-800 mb-2 transition-all" />
                       <p className="text-[9px] font-black text-black uppercase tracking-widest">{receiptFile ? receiptFile.name : 'Selecionar Documento'}</p>
                    </div>
                 </div>
                 <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsTransactionModalOpen(false)} className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                    <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all">Confirmar Lançamento</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* VISUALIZAÇÃO DE COMPROVANTE / CARTÃO */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4" onClick={() => setViewingReceipt(null)}>
           <div className="relative max-w-5xl max-h-[95vh] w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                   <FileText size={24} className="text-amber-500" />
                   <h4 className="font-black text-sm uppercase tracking-widest">Inspeção de Documento Digital</h4>
                </div>
                <button onClick={() => setViewingReceipt(null)} className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-90"><X size={28}/></button>
              </div>
              <div className="p-4 flex items-center justify-center min-h-[500px] bg-slate-100 overflow-auto">
                 {viewingReceipt.startsWith('blob:') || viewingReceipt.startsWith('http') || viewingReceipt.startsWith('data:') ? (
                   <img src={viewingReceipt} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" alt="Documento" />
                 ) : (
                   <div className="text-center p-12">
                      <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
                      <p className="text-black font-black uppercase tracking-widest leading-relaxed">Não foi possível carregar a imagem.<br/>O arquivo pode estar corrompido ou indisponível.</p>
                   </div>
                 )}
              </div>
              <div className="bg-white p-6 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest">ID de Auditoria: PM-{Math.random().toString(16).slice(2,8).toUpperCase()}</p>
                  <button onClick={() => setViewingReceipt(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Fechar Visualização</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: GERENCIAR PORTADORES */}
      {isManageHoldersModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-scale-in flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-8 flex justify-between items-center shrink-0">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Settings size={24} className="text-amber-500" /> Gestão de Portadores</h3>
                 <button onClick={() => setIsManageHoldersModalOpen(false)} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 divide-y divide-slate-100">
                 {cardHolders.length > 0 ? cardHolders.map(holder => (
                   <div key={holder.id} className="py-6 flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-black font-black uppercase border border-slate-200">{holder.name.substring(0, 2)}</div>
                         <div>
                            <p className="font-black text-sm text-black uppercase tracking-tight">{holder.name}</p>
                            <p className="text-[10px] text-black font-bold uppercase tracking-widest mt-1">Limite: € {holder.cardLimit?.toLocaleString('pt-PT')} • Final {holder.cardLast4}</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button 
                            onClick={() => {
                              setCardFormData({ 
                                cardLimit: holder.cardLimit || 0, 
                                cardLast4: holder.cardLast4 || '', 
                                cardExpiry: holder.cardExpiry || '', 
                                employeeId: holder.id, 
                                name: holder.name 
                              });
                              setIsEditCardModalOpen(true);
                            }}
                            className="p-3 text-black hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                         >
                            <Edit size={18} />
                         </button>
                         <button 
                            onClick={() => setIsDeleteConfirmOpen({empId: holder.id, name: holder.name})}
                            className="p-3 text-black hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                         >
                            <Trash2 size={18} />
                         </button>
                      </div>
                   </div>
                 )) : (
                   <div className="py-24 text-center">
                      <CreditCard size={48} className="mx-auto text-slate-100 mb-4" />
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Nenhum portador cadastrado</p>
                   </div>
                 )}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => { setIsManageHoldersModalOpen(false); setIsNewHolderModalOpen(true); }}
                    className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-black"
                  >
                    <Plus size={16}/> Adicionar Novo Vínculo
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE REVOGAÇÃO */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32}/></div>
              <h3 className="text-xl font-black text-black uppercase mb-2">Revogar Cartão?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed italic">Tem certeza que deseja desativar o cartão corporativo de <span className="text-black font-black">{isDeleteConfirmOpen.name}</span>?</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setIsDeleteConfirmOpen(null)} className="py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Manter</button>
                 <button onClick={() => handleRevokeCard(isDeleteConfirmOpen.empId)} className="py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all">Revogar Agora</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CorporateCardView;
