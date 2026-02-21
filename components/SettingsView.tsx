
import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, ShieldCheck, Database, AlertTriangle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { databaseService } from '../services/databaseService';

interface SettingsViewProps {
  onImportSuccess: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onImportSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    checkGoogleAuth();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setIsGoogleAuth(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkGoogleAuth = async () => {
    try {
      const response = await fetch('/api/auth/google/status');
      const data = await response.json();
      setIsGoogleAuth(data.isAuthenticated);
    } catch (error) {
      console.error('Error checking Google auth status:', error);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
      alert('Erro ao conectar com o Google.');
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await fetch('/api/auth/google/logout', { method: 'POST' });
      setIsGoogleAuth(false);
    } catch (error) {
      console.error('Error logging out of Google:', error);
    }
  };

  const handleBackupToDrive = async () => {
    setIsBackingUp(true);
    try {
      const data = databaseService.getAllData();
      const response = await fetch('/api/drive/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Backup salvo com sucesso no seu Google Drive!');
      } else {
        const err = await response.json();
        alert(`Erro ao salvar backup: ${err.error}`);
      }
    } catch (error) {
      console.error('Error backing up to Drive:', error);
      alert('Erro de conexão ao salvar backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!confirm("Isso irá substituir todos os dados atuais pelos dados do Google Drive. Deseja continuar?")) return;

    setIsRestoring(true);
    try {
      const response = await fetch('/api/drive/restore');
      if (response.ok) {
        const data = await response.json();
        databaseService.importAllData(data);
        onImportSuccess();
        alert('Dados restaurados com sucesso do Google Drive!');
      } else {
        const err = await response.json();
        alert(`Erro ao restaurar: ${err.error}`);
      }
    } catch (error) {
      console.error('Error restoring from Drive:', error);
      alert('Erro de conexão ao restaurar backup.');
    } finally {
      setIsRestoring(false);
    }
  };

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
            <div className={`p-4 rounded-2xl ${isGoogleAuth ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Cloud size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Google Drive Cloud</h3>
              <p className="text-xs text-slate-500 font-bold uppercase">Sincronização em nuvem</p>
            </div>
          </div>

          {!isGoogleAuth ? (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Conecte sua conta Google para salvar seus backups automaticamente na nuvem e acessá-los de qualquer dispositivo.
              </p>
              <button 
                onClick={handleConnectGoogle}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl"
              >
                Conectar Google Drive
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Conectado</span>
                </div>
                <button onClick={handleDisconnectGoogle} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-600 transition-colors">Desconectar</button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleBackupToDrive}
                  disabled={isBackingUp}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg disabled:opacity-50"
                >
                  {isBackingUp ? <RefreshCw size={18} className="animate-spin" /> : <Cloud size={18} className="text-blue-400" />}
                  Salvar no Drive
                </button>
                <button 
                  onClick={handleRestoreFromDrive}
                  disabled={isRestoring}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-900 text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {isRestoring ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  Buscar do Drive
                </button>
              </div>
            </div>
          )}
        </div>

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
