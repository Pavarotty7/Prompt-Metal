
import React, { useState, useRef } from 'react';
import { Project, Transaction, Vehicle } from '../types';
import { generateStrategicAnalysis } from '../services/geminiService';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck,
  Save
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { databaseService } from '../services/databaseService';

interface AIAdvisorProps {
  projects: Project[];
  transactions: Transaction[];
  fleet: Vehicle[];
  onRefreshData?: () => void;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ projects, transactions, fleet, onRefreshData }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateStrategicAnalysis(projects, transactions, fleet);
    setAnalysis(result);
    setLoading(false);
  };

  const handleExportBackup = () => {
    const data = databaseService.exportDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PromptMetal_Total_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = databaseService.importDatabase(content);
      if (success) {
        alert("Backup restaurado com sucesso! Toda a base de dados foi atualizada.");
        if (onRefreshData) onRefreshData();
      } else {
        alert("Falha ao importar backup. Verifique se o arquivo .json é válido.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header Principal */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-2xl mb-2">
          <BrainCircuit className="text-white h-10 w-10" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Consultor Estratégico & Dados</h2>
        <p className="text-slate-500 max-w-xl mx-auto font-medium italic">
          Inteligência artificial aplicada à gestão e segurança total das suas informações corporativas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel Lateral de Gestão de Dados */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Database size={80} />
            </div>
            
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-600" /> Segurança de Dados
            </h3>
            
            <div className="space-y-4">
              <button 
                onClick={handleExportBackup}
                className="w-full group flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-black transition-all shadow-xl active:scale-95"
              >
                <Download size={28} className="text-amber-500 mb-2 group-hover:animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest">Fazer Backup Total</span>
                <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Salvar todo o progresso</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full group flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 text-slate-900 rounded-[2rem] hover:border-indigo-500 hover:bg-indigo-50/30 transition-all shadow-sm active:scale-95"
              >
                <Upload size={28} className="text-indigo-600 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Importar Backup</span>
                <span className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Restaurar de arquivo .json</span>
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImportBackup} 
              />

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><Save size={16}/></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Auto-Sync</p>
                    <p className="text-[10px] font-black text-slate-900 uppercase mt-0.5">Nuvem Local Ativa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl">
             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Informação de Sessão</h4>
             <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Projetos:</span>
                  <span className="text-[10px] font-black">{projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Transações:</span>
                  <span className="text-[10px] font-black">{transactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Frota:</span>
                  <span className="text-[10px] font-black">{fleet.length}</span>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest border border-white/5"
                >
                  <RefreshCw size={14} /> Sincronizar Tudo
                </button>
             </div>
          </div>
        </div>

        {/* Painel Central de IA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="bg-slate-900 px-10 py-8 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Relatório Estratégico</h3>
                    <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mt-0.5">Processado por Google Gemini Engine</p>
                  </div>
               </div>
               {!loading && (
                 <button 
                    onClick={handleGenerate}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10"
                    title="Regerar Análise"
                 >
                    <RefreshCw size={20} />
                 </button>
               )}
            </div>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
              {!analysis && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                   <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
                      <BrainCircuit size={48} />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase">Consultoria de Negócio IA</h4>
                      <p className="text-slate-500 max-w-sm mx-auto mt-2 italic">A IA analisará seu fluxo de caixa, o status de cada obra e a eficiência da sua frota para fornecer insights de alto nível.</p>
                   </div>
                   <button
                    onClick={handleGenerate}
                    className="group relative inline-flex items-center justify-center px-12 py-5 font-black text-white transition-all duration-300 bg-slate-900 rounded-[2rem] hover:bg-black hover:shadow-2xl hover:-translate-y-1 shadow-xl uppercase tracking-[0.2em] text-xs border border-amber-500/20"
                  >
                    <span>Iniciar Análise Estratégica</span>
                    <Sparkles size={18} className="ml-3 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Engenharia de Dados em Curso...</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2 leading-relaxed">Cruzando indicadores financeiros com cronogramas de obras para formular recomendações otimizadas.</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="prose prose-slate max-w-none animate-fade-in">
                  <div className="whitespace-pre-wrap font-medium leading-relaxed text-slate-900 selection:bg-indigo-100 text-sm">
                     {analysis}
                  </div>
                </div>
              )}
            </div>

            {analysis && (
              <div className="bg-slate-50 px-10 py-5 border-t border-slate-100 text-[9px] font-black text-slate-400 text-center uppercase tracking-widest shrink-0">
                 Atenção: Relatório gerencial gerado por IA. Use como base de apoio à decisão, não como verdade absoluta.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;

import { BrainCircuit } from 'lucide-react';
