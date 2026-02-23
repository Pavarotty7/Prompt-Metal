
import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, ShieldCheck, Database, AlertTriangle, Cloud, CloudOff, RefreshCw, History, CheckCircle2 } from 'lucide-react';
import { databaseService } from '../services/databaseService';

interface DriveHistoryItem {
  id: string;
  name: string;
  createdTime: string;
}

interface SettingsViewProps {
  onImportSuccess: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onImportSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveHistory, setDriveHistory] = useState<DriveHistoryItem[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    checkDriveStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkDriveStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkDriveStatus = async () => {
    try {
      const res = await fetch('/api/auth/google/status', { credentials: 'include' });
      if (!res.ok) {
        setIsDriveConnected(false);
        return;
      }

      const data = await res.json();
      setIsDriveConnected(data.connected);
      if (data.connected) {
        await fetchDriveHistory();
      }
    } catch (error) {
      console.error("Error checking drive status:", error);
      setIsDriveConnected(false);
    }
  };

  const fetchDriveHistory = async () => {
    try {
      const res = await fetch('/api/drive/history', { credentials: 'include' });
      if (!res.ok) {
        setDriveHistory([]);
        return;
      }

      const data = await res.json();
      setDriveHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      setDriveHistory([]);
    }
  };

  const handleConnectDrive = async () => {
    const popup = window.open('', 'google_oauth', 'width=600,height=700');

    if (!popup) {
      alert('Não foi possível abrir a janela de login. Verifique se o bloqueador de pop-up está desativado para este site.');
      return;
    }

    popup.document.write('<p style="font-family: sans-serif; padding: 16px;">Conectando ao Google Drive...</p>');

    try {
      const res = await fetch('/api/auth/google/url', { credentials: 'include' });
      if (!res.ok) {
        popup.close();
        alert('Não foi possível iniciar a autenticação com o Google Drive.');
        return;
      }

      const data = await res.json();
      const authUrl = typeof data?.url === 'string' ? data.url : '';

      if (!authUrl.startsWith('http')) {
        popup.close();
        alert(data?.error || 'URL de autenticação inválida. Verifique as configurações do Google OAuth nas Functions.');
        return;
      }

      popup.location.href = authUrl;
    } catch (error) {
      console.error("Error getting auth url:", error);
      popup.close();
      alert('Erro ao conectar com o Google Drive.');
    }
  };

  const handleDisconnectDrive = async () => {
    if (!confirm("Deseja desconectar sua conta do Google Drive?")) return;
    try {
      await fetch('/api/auth/google/logout', { method: 'POST', credentials: 'include' });
      setIsDriveConnected(false);
      setDriveHistory([]);
      setBackupStatusMessage(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDriveBackup = async () => {
    setIsBackingUp(true);
    setBackupStatusMessage(null);
    try {
      const statusRes = await fetch('/api/auth/google/status', { credentials: 'include' });
      if (!statusRes.ok) {
        setIsDriveConnected(false);
        setBackupStatusMessage('Não foi possível validar a conexão.');
        alert('Não foi possível validar a conexão com o Google Drive.');
        return;
      }

      const statusData = await statusRes.json();
      if (!statusData.connected) {
        setIsDriveConnected(false);
        setBackupStatusMessage('Conecte o Google Drive para salvar backup.');
        alert('Conecte sua conta Google Drive antes de salvar.');
        return;
      }

      const data = databaseService.getAllData();
      const res = await fetch('/api/drive/backup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          filename: `promptmetal_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          setIsDriveConnected(false);
          setBackupStatusMessage('Sessão expirada. Reconecte o Google Drive.');
          alert('Sessão expirada. Reconecte sua conta Google Drive.');
          return;
        }

        const errorBody = await res.json().catch(() => ({}));
        const errorMessage = errorBody?.error || 'Erro ao realizar backup no Google Drive.';
        setBackupStatusMessage(errorMessage);
        alert(errorMessage);
        return;
      }

      const result = await res.json();
      if (result.success) {
        setDriveHistory(result.history);
        setBackupStatusMessage('Backup salvo com sucesso no Google Drive.');
        alert("Backup realizado com sucesso no Google Drive!");
      } else {
        setBackupStatusMessage('Falha ao salvar backup no Google Drive.');
        alert("Falha ao salvar backup no Google Drive.");
      }
    } catch (error) {
      console.error("Backup error:", error);
      setBackupStatusMessage('Erro de conexão ao salvar backup.');
      alert("Erro ao realizar backup.");
    } finally {
      setIsBackingUp(false);
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
        {/* Google Drive Integration */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 md:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isDriveConnected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {isDriveConnected ? <Cloud size={24} /> : <CloudOff size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Google Drive Sync</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Backup automático e sincronização na nuvem</p>
              </div>
            </div>

            {isDriveConnected ? (
              <div className="flex gap-3">
                <button
                  onClick={handleDriveBackup}
                  disabled={isBackingUp}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                >
                  {isBackingUp ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Sincronizar Agora
                </button>
                <button
                  onClick={handleDisconnectDrive}
                  className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectDrive}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <Cloud size={16} /> Conectar Google Drive
              </button>
            )}
          </div>

          {isDriveConnected && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {backupStatusMessage && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{backupStatusMessage}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <History size={14} /> Histórico de Backups (Últimos 3)
                </div>
                <div className="space-y-3">
                  {driveHistory.length > 0 ? driveHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[200px] md:max-w-md">{item.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">{new Date(item.createdTime).toLocaleString('pt-PT')}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase">Salvo</span>
                    </div>
                  )) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum backup encontrado</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3">Como funciona?</h4>
                <ul className="space-y-3">
                  <li className="flex gap-2 text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></div>
                    Os dados são salvos na pasta "PromptMetal Backups" no seu Drive.
                  </li>
                  <li className="flex gap-2 text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></div>
                    Mantemos apenas os 3 backups mais recentes para economizar espaço.
                  </li>
                  <li className="flex gap-2 text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0"></div>
                    A sincronização garante que você nunca perca seus projetos.
                  </li>
                </ul>
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
