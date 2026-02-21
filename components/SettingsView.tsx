
import React, { useRef } from 'react';
import { Download, Upload, ShieldCheck, Database, AlertTriangle } from 'lucide-react';
import { databaseService } from '../services/databaseService';

interface SettingsViewProps {
  onImportSuccess: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onImportSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    const data = databaseService.getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promptmetal_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (confirm("Isso irá substituir todos os dados atuais. Deseja continuar?")) {
          databaseService.importAllData(data);
          onImportSuccess();
          alert("Backup importado com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao importar backup:", error);
        alert("Erro ao importar arquivo. Verifique se o formato está correto.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Configurações do Sistema</h2>
          <p className="text-slate-600 font-medium italic">Gerenciamento de dados e segurança</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-slate-900 text-white rounded-2xl">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Backup de Dados</h3>
              <p className="text-xs text-slate-500 font-bold uppercase">Exporte todos os seus dados para segurança</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 mb-8 leading-relaxed">
            Recomendamos realizar o backup semanalmente para garantir a integridade das suas informações. O arquivo gerado contém projetos, transações, equipe e registros de frota.
          </p>

          <button 
            onClick={handleExportBackup}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
          >
            <Download size={20} className="text-amber-500" /> Baixar Backup (.json)
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-amber-500 text-slate-900 rounded-2xl">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Importar Backup</h3>
              <p className="text-xs text-slate-500 font-bold uppercase">Restaurar dados de um arquivo anterior</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-8 flex gap-4">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <p className="text-[10px] text-amber-800 font-bold uppercase leading-relaxed">
              Atenção: A importação irá SOBRESCREVER todos os dados atuais do sistema. Certifique-se de que o arquivo é válido.
            </p>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportBackup} 
            className="hidden" 
            accept=".json"
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-900 text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            <Upload size={20} /> Selecionar Arquivo
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
            <ShieldCheck size={32} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xl font-black uppercase tracking-tight">Segurança PromptMetal</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Seus dados são armazenados localmente e criptografados pelo navegador.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Versão do Sistema</p>
          <p className="text-sm font-black text-amber-500">v2.4.0-PRO</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
