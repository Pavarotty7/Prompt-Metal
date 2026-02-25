import React, { useMemo } from 'react';
import { Project, Transaction, TimesheetRecord, MaterialLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingDown, Wallet, ArrowUpRight, Receipt, Users, Package } from 'lucide-react';

interface ProjectStatementProps {
  project: Project;
  transactions: Transaction[];
  timesheetRecords: TimesheetRecord[];
}

interface ConsolidatedExpense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  source: 'Financeiro' | 'Material' | 'Mão de Obra';
}

const ProjectStatement: React.FC<ProjectStatementProps> = ({ project, transactions, timesheetRecords }) => {
  const consolidatedExpenses = useMemo(() => {
    const expenses: ConsolidatedExpense[] = [];

    // 1. Transações Financeiras (Apenas despesas vinculadas ao projeto)
    transactions
      .filter(t => t.projectId === project.id && t.type === 'expense')
      .forEach(t => {
        expenses.push({
          id: t.id,
          date: t.date,
          description: t.description,
          category: t.category,
          amount: t.amount,
          source: 'Financeiro'
        });
      });

    // 2. Registros de Materiais
    (project.materialLogs || []).forEach(m => {
      expenses.push({
        id: m.id,
        date: m.date,
        description: m.materialName,
        category: m.category || 'Material',
        amount: m.quantity * m.unitPrice,
        source: 'Material'
      });
    });

    // 3. Registros de Ponto (Mão de Obra)
    timesheetRecords
      .filter(r => r.projectId === project.id && r.status === 'Presente')
      .forEach(r => {
        expenses.push({
          id: r.id,
          date: r.date,
          description: `Mão de Obra: ${r.employeeName}`,
          category: 'Mão de Obra',
          amount: r.totalPay,
          source: 'Mão de Obra'
        });
      });

    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [project, transactions, timesheetRecords]);

  const totalSpent = useMemo(() => consolidatedExpenses.reduce((acc, curr) => acc + curr.amount, 0), [consolidatedExpenses]);
  const remainingBalance = project.budget - totalSpent;
  const percentageSpent = (totalSpent / project.budget) * 100;

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    consolidatedExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [consolidatedExpenses]);

  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Wallet size={120} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Orçamento Previsto</p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-400">€</span>
            <h3 className="text-4xl font-black">{project.budget.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-red-600">
            <TrendingDown size={120} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Total Executado</p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-400">€</span>
            <h3 className="text-4xl font-black text-red-600">{totalSpent.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${percentageSpent > 90 ? 'bg-red-500' : 'bg-slate-900'}`}
                style={{ width: `${Math.min(100, percentageSpent)}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-slate-400">{percentageSpent.toFixed(1)}%</span>
          </div>
        </div>

        <div className={`rounded-[2.5rem] p-8 border shadow-sm relative overflow-hidden group transition-colors ${remainingBalance < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className={`absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 ${remainingBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            <DollarSign size={120} />
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${remainingBalance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>Saldo Disponível</p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold opacity-50">€</span>
            <h3 className={`text-4xl font-black ${remainingBalance < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {remainingBalance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* CHART & CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-slate-400" /> Distribuição de Custos
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <TrendingDown size={18} className="text-slate-400" /> Maiores Gastos por Categoria
          </h4>
          <div className="space-y-4">
            {categoryData.slice(0, 5).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{cat.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">€ {cat.value.toLocaleString('pt-PT')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Receipt size={18} className="text-slate-400" /> Extrato Detalhado de Lançamentos
          </h4>
          <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-3 py-1 rounded-full uppercase">
            {consolidatedExpenses.length} Registros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                <th className="py-5 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                <th className="py-5 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Categoria</th>
                <th className="py-5 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Origem</th>
                <th className="py-5 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {consolidatedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-all group">
                  <td className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase">
                    {new Date(expense.date).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="py-5 px-8">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{expense.description}</p>
                  </td>
                  <td className="py-5 px-8">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                      {expense.source === 'Financeiro' && <DollarSign size={12} className="text-blue-500" />}
                      {expense.source === 'Material' && <Package size={12} className="text-amber-500" />}
                      {expense.source === 'Mão de Obra' && <Users size={12} className="text-emerald-500" />}
                      <span className="text-slate-400">{expense.source}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <span className="text-sm font-black text-slate-900">
                      € {expense.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
              {consolidatedExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 italic">
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum gasto registrado para esta obra.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatement;
