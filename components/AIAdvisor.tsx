
import React, { useState } from 'react';
import { Project, Transaction, Vehicle } from '../types';
import { generateStrategicAnalysis } from '../services/geminiService';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAdvisorProps {
  projects: Project[];
  transactions: Transaction[];
  fleet: Vehicle[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ projects, transactions, fleet }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateStrategicAnalysis(projects, transactions, fleet);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg mb-2">
          <Sparkles className="text-white h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Consultor Estratégico PromptMetal</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Utilize inteligência artificial para analisar seus indicadores financeiros, progresso de obras e eficiência da frota.
        </p>
      </div>

      {!analysis && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleGenerate}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-slate-900 rounded-full hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
          >
            <span className="mr-2">Gerar Relatório Estratégico</span>
            <Sparkles size={18} className="group-hover:animate-pulse" />
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-black text-slate-800 uppercase">Analisando Dados...</h3>
          <p className="text-slate-500 text-sm">O Gemini está processando seus KPIs e formulando recomendações.</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-indigo-50 overflow-hidden">
          <div className="bg-slate-900 px-8 py-6 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <FileText className="text-amber-500" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Relatório de Inteligência</h3>
             </div>
             <button 
                onClick={handleGenerate}
                className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all"
             >
                Atualizar Análise
             </button>
          </div>
          <div className="p-8 prose prose-slate max-w-none text-slate-900">
            <div className="whitespace-pre-wrap font-medium leading-relaxed text-slate-900 selection:bg-amber-200">
               {analysis}
            </div>
          </div>
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">
             Análise gerada por IA (Google Gemini). Verifique sempre os dados antes de tomar decisões críticas.
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;
