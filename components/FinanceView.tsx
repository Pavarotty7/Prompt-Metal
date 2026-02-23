
import React, { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Transaction, Project, UserRole } from '../types';
import { fileEncodingService } from '../services/fileEncodingService';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  FileText,
  Plus,
  X,
  Save,
  DollarSign,
  PieChart as PieIcon,
  Table as TableIcon,
  TrendingUp,
  Edit,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  UploadCloud,
  Paperclip,
  Eye,
  MessageSquare,
  Search,
  Activity,
  Calendar
} from 'lucide-react';

interface FinanceViewProps {
  transactions: Transaction[];
  projects?: Project[];
  userRole?: UserRole;
  onAddTransaction?: (t: Transaction) => void;
  onUpdateTransaction?: (t: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  projects = [],
  userRole,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cashflow'>('overview');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    description: '',
    category: 'Receita',
    projectId: '',
    type: 'income' as 'income' | 'expense',
    dueDate: '',
    amount: '',
    status: 'Pendente' as 'Pago' | 'Pendente',
    notes: ''
  });

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const isAdmin = userRole === 'admin';

  const handleExportExcel = useCallback(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Filter transactions for current month if needed, or just export filtered list
    // The user asked for "extrato mensal", so let's filter by current month by default
    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    const dataToExport = currentMonthTransactions.map(t => ({
      'Data': t.date ? new Date(t.date).toLocaleDateString('pt-PT') : 'N/A',
      'Descrição': t.description,
      'Categoria': t.category,
      'Obra': projects.find(p => p.id === t.projectId)?.name || 'Geral',
      'Tipo': t.type === 'income' ? 'Entrada' : 'Saída',
      'Status': t.status,
      'Valor (€)': t.amount,
      'Notas': t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Extrato Mensal");

    // Auto-size columns
    const max_width = dataToExport.reduce((w, r) => Math.max(w, r.Descrição.length), 10);
    worksheet["!cols"] = [{ wch: 12 }, { wch: max_width }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 30 }];

    XLSX.writeFile(workbook, `Extrato_Mensal_${month}_${year}.xlsx`);
  }, [transactions, projects]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditingTransactionId(null);
    setAttachmentFile(null);
    setFormData({
      description: '',
      category: 'Receita',
      projectId: '',
      type: 'income',
      dueDate: new Date().toISOString().split('T')[0],
      amount: '',
      status: 'Pendente',
      notes: ''
    });
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((t: Transaction) => {
    setEditingTransactionId(t.id);
    setAttachmentFile(null);
    setFormData({
      description: t.description,
      category: t.category,
      projectId: t.projectId || '',
      type: t.type,
      dueDate: t.date,
      amount: t.amount.toString(),
      status: t.status,
      notes: t.notes || ''
    });
    setIsFormOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (transactionToDelete && onDeleteTransaction) {
      onDeleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
    }
  }, [transactionToDelete, onDeleteTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const attachmentInfo = attachmentFile ? {
      attachmentName: attachmentFile.name,
      attachmentUrl: await fileEncodingService.fileToDataUrl(attachmentFile)
    } : {};

    if (editingTransactionId && onUpdateTransaction) {
      const existing = transactions.find(tx => tx.id === editingTransactionId);
      const updatedTransaction: Transaction = {
        id: editingTransactionId,
        date: formData.dueDate,
        description: formData.description,
        category: formData.category as any,
        amount: parseFloat(formData.amount) || 0,
        type: formData.type,
        status: formData.status,
        projectId: formData.projectId || undefined,
        notes: formData.notes,
        ...(attachmentFile ? attachmentInfo : {
          attachmentName: existing?.attachmentName,
          attachmentUrl: existing?.attachmentUrl
        })
      };
      onUpdateTransaction(updatedTransaction);
    } else if (onAddTransaction) {
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        date: formData.dueDate,
        description: formData.description,
        category: formData.category as any,
        amount: parseFloat(formData.amount) || 0,
        type: formData.type,
        status: formData.status,
        projectId: formData.projectId || undefined,
        notes: formData.notes,
        ...attachmentInfo
      };
      onAddTransaction(newTransaction);
    }

    setIsFormOpen(false);
    setAttachmentFile(null);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filter === 'all' || t.type === filter;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, filter, searchTerm]);

  const stats = useMemo(() => {
    const inc = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + c.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Controle Financeiro</h2>
            <p className="text-slate-600 font-medium italic">Gestão centralizada de fluxo de caixa e comprovantes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm border border-slate-300 transition-all"
            >
              <FileText size={20} className="text-blue-600" /> Exportar Excel
            </button>
            {isAdmin && (
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-2xl active:scale-95 transition-all border-2 border-emerald-500/50"
              >
                <Plus size={20} className="text-emerald-500" /> Novo Lançamento
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-b border-slate-300 mb-6 gap-4">
          <div className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'overview'
                  ? 'border-b-4 border-emerald-600 text-emerald-900'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <PieIcon size={18} /> Visão Geral & Contas
            </button>
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'cashflow'
                  ? 'border-b-4 border-blue-600 text-blue-900'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <TrendingUp size={18} /> Fluxo de Caixa
            </button>
          </div>

          <div className="flex bg-slate-200 p-1 rounded-xl mb-3 border border-slate-300">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}>Todos</button>
            <button onClick={() => setFilter('income')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'income' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'}`}>Entradas</button>
            <button onClick={() => setFilter('expense')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'expense' ? 'bg-red-700 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'}`}>Saídas</button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Consolidado do Período</h3>
              <div className="space-y-4">
                {(filter === 'all' || filter === 'income') && (
                  <div className="flex justify-between items-center p-4 bg-emerald-100 border border-emerald-300 rounded-2xl">
                    <div className="flex items-center gap-3"><ArrowUpCircle className="text-emerald-800" size={24} /><span className="text-emerald-950 font-black text-xs uppercase tracking-widest">Receitas</span></div>
                    <span className="text-emerald-900 font-black text-lg">€ {stats.income.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(filter === 'all' || filter === 'expense') && (
                  <div className="flex justify-between items-center p-4 bg-red-100 border border-red-300 rounded-2xl">
                    <div className="flex items-center gap-3"><ArrowDownCircle className="text-red-800" size={24} /><span className="text-red-950 font-black text-xs uppercase tracking-widest">Despesas</span></div>
                    <span className="text-red-900 font-black text-lg">€ {stats.expense.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-slate-200 flex justify-between items-center px-2">
                  <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Saldo Líquido</span>
                  <span className={`font-black text-2xl ${stats.balance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                    € {stats.balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Listagem Analítica</h3>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-900" />
                <input
                  type="text"
                  placeholder="Filtrar por descrição..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300">
                  <tr>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-900 uppercase tracking-widest">Data</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-900 uppercase tracking-widest">Descrição / Obra</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Status</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Valor (€)</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Docs</th>
                    {isAdmin && <th className="py-4 px-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-5 px-6"><p className="text-xs font-black text-slate-900">{t.date ? new Date(t.date).toLocaleDateString('pt-PT') : 'N/A'}</p></td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2"><p className="text-sm font-black text-slate-950 uppercase tracking-tight leading-none mb-1">{t.description}</p>{t.notes && (<div className="group relative inline-block"><MessageSquare size={14} className="text-indigo-700 cursor-help" /><div className="absolute bottom-full left-0 mb-3 w-56 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-2xl border border-white/10"><p className="font-black text-indigo-400 uppercase mb-1">Notas:</p>{t.notes}</div></div>)}</div>
                        <div className="flex items-center gap-2"><span className="text-[9px] font-black text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded uppercase border border-slate-300">{t.category}</span><span className="text-[9px] text-slate-800 font-bold uppercase truncate max-w-[150px]">{projects.find(p => p.id === t.projectId)?.name || 'Geral'}</span></div>
                      </td>
                      <td className="py-5 px-6 text-center"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${t.status === 'Pago' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'}`}>{t.status}</span></td>
                      <td className={`py-5 px-6 text-sm font-black text-right ${t.type === 'income' ? 'text-emerald-800' : 'text-red-800'}`}>{t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                      <td className="py-5 px-6 text-center">{t.attachmentUrl ? <button onClick={() => setViewingAttachment(t.attachmentUrl!)} className="p-2 bg-blue-100 text-blue-900 border border-blue-300 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Paperclip size={16} /></button> : <span className="text-slate-400">—</span>}</td>
                      {isAdmin && (
                        <td className="py-5 px-6 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(t)} className="p-2 text-slate-800 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-300"><Edit size={16} /></button>
                            <button onClick={() => setTransactionToDelete(t.id)} className="p-2 text-slate-800 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-300"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest italic">
                        Nenhum lançamento encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR LANÇAMENTO */}
      {isFormOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300 animate-scale-in flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white shrink-0">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <DollarSign size={24} className="text-emerald-500" /> {editingTransactionId ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Tipo de Lançamento</label>
                  <div className="flex bg-slate-200 p-1.5 rounded-2xl gap-1 border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income', category: 'Receita' })}
                      className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${formData.type === 'income' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-700 hover:text-slate-900'}`}
                    >
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense', category: 'Material' })}
                      className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${formData.type === 'expense' ? 'bg-red-700 text-white shadow-lg' : 'text-slate-700 hover:text-slate-900'}`}
                    >
                      Saída
                    </button>
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Status do Pagamento</label>
                  <div className="flex bg-slate-200 p-1.5 rounded-2xl gap-1 border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'Pago' })}
                      className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${formData.status === 'Pago' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-700 hover:text-slate-900'}`}
                    >
                      Efetuado
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'Pendente' })}
                      className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${formData.status === 'Pendente' ? 'bg-amber-600 text-black shadow-lg' : 'text-slate-700 hover:text-slate-900'}`}
                    >
                      Pendente
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Descrição detalhada</label>
                  <input
                    type="text"
                    required
                    name="description"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
                    placeholder="Ex: Pagamento Fornecedor Aço / Recebimento Etapa 1"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Valor do Lançamento (€)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4 top-4 text-slate-900" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      name="amount"
                      className={`w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-lg font-black outline-none focus:ring-2 ${formData.type === 'income' ? 'text-emerald-800 focus:ring-emerald-600' : 'text-red-800 focus:ring-red-600'}`}
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Data do Lançamento</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-4 text-slate-900" />
                    <input
                      type="date"
                      required
                      name="dueDate"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Categoria</label>
                  <select
                    name="category"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    {formData.type === 'income' ? (
                      <option value="Receita">Receita de Obra / Cliente</option>
                    ) : (
                      <>
                        <option value="Material">Material de Construção</option>
                        <option value="Mão de Obra">Mão de Obra / Diárias</option>
                        <option value="Combustível">Frota / Combustível</option>
                        <option value="Despesa Fixa">Despesa Fixa / Escritório</option>
                        <option value="Outros">Outras Despesas</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Vincular a Obra (Opcional)</label>
                  <select
                    name="projectId"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.projectId}
                    onChange={handleInputChange}
                  >
                    <option value="">Despesa Geral / Corporativa</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Anexar Nota Fiscal / Recibo</label>
                  <div className="border-2 border-dashed border-slate-400 rounded-2xl p-6 bg-slate-100 relative group flex flex-col items-center justify-center transition-all hover:border-slate-900 hover:bg-slate-200">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => setAttachmentFile(e.target.files?.[0] || null)}
                    />
                    <UploadCloud size={40} className="text-slate-900 mb-2 transition-all" />
                    <p className="text-[11px] font-black text-slate-950 uppercase tracking-widest">
                      {attachmentFile ? attachmentFile.name : 'Clique ou arraste o arquivo aqui'}
                    </p>
                    <p className="text-[9px] text-slate-700 mt-1 uppercase font-bold">PDF, JPG ou PNG (Max 5MB)</p>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-950 uppercase mb-2 tracking-widest">Notas Adicionais</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 resize-none placeholder:text-slate-400"
                    placeholder="Observações internas importantes..."
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-8 py-4 text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 text-white px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center gap-2 border-2 border-emerald-500/50"
                >
                  <Save size={18} className="text-emerald-500" /> Finalizar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in border border-red-200">
            <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black text-slate-950 uppercase mb-2">Remover Registro?</h3>
            <p className="text-slate-700 text-sm mb-8 leading-relaxed italic font-medium">Deseja excluir este lançamento permanentemente? Esta ação afetará o saldo atual.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setTransactionToDelete(null)} className="py-4 text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 rounded-xl">Manter</button>
              <button onClick={confirmDelete} className="py-4 bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-800 shadow-xl shadow-red-600/20 transition-all">Excluir</button>
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
                <FileText size={24} className="text-emerald-500" />
                <h4 className="font-black text-sm uppercase tracking-widest">Documento Digitalizado</h4>
              </div>
              <button onClick={() => setViewingAttachment(null)} className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-90"><X size={28} /></button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[500px] bg-slate-100 overflow-auto">
              <img src={viewingAttachment} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" alt="Anexo Financeiro" />
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

export default React.memo(FinanceView);
