
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectsView from './components/ProjectsView';
import ProjectDetailView from './components/ProjectDetailView';
import FinanceView from './components/FinanceView';
import FleetView from './components/FleetView';
import AIAdvisor from './components/AIAdvisor';
import TeamView from './components/TeamView';
import TimesheetView from './components/TimesheetView';
import CorporateCardView from './components/CorporateCardView';
import HomeLanding from './components/HomeLanding';
import RoleSelection from './components/RoleSelection';
import ScheduleView from './components/ScheduleView';
import NotesView from './components/NotesView';
import SettingsView from './components/SettingsView';
import { ViewState, Transaction, Project, Employee, UserRole, Vehicle, TimesheetRecord, ScheduleTask, DailyNote } from './types';
import { databaseService } from './services/databaseService';

type CloudSyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [timesheetRecords, setTimesheetRecords] = useState<TimesheetRecord[]>([]);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle');
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<Date | null>(null);
  const isApplyingCloudData = useRef(false);

  const applyDataToState = useCallback((data: any) => {
    if (!data) return;

    databaseService.importAllData(data);
    setProjects(databaseService.getProjects());
    setTransactions(databaseService.getTransactions());
    setEmployees(databaseService.getEmployees());
    setVehicles(databaseService.getVehicles());
    setTimesheetRecords(databaseService.getTimesheets());
    setScheduleTasks(databaseService.getScheduleTasks());
    setNotes(databaseService.getNotes());
  }, []);

  // Carregar dados locais e sincronizar com Firestore (quando conectado ao Google)
  useEffect(() => {
    const initializeData = async () => {
      const savedRole = localStorage.getItem('promptmetal_role') as UserRole;
      if (savedRole) setUserRole(savedRole);

      setProjects(databaseService.getProjects());
      setTransactions(databaseService.getTransactions());
      setEmployees(databaseService.getEmployees());
      setVehicles(databaseService.getVehicles());
      setTimesheetRecords(databaseService.getTimesheets());
      setScheduleTasks(databaseService.getScheduleTasks());
      setNotes(databaseService.getNotes());

      try {
        const statusRes = await fetch('/api/auth/google/status', { credentials: 'include' });
        if (!statusRes.ok) {
          setCloudSyncStatus('offline');
          setHasHydrated(true);
          return;
        }

        const { connected } = await statusRes.json();
        setIsCloudConnected(!!connected);

        if (!connected) {
          setCloudSyncStatus('offline');
          setHasHydrated(true);
          return;
        }

        const loadRes = await fetch('/api/data/load', { credentials: 'include' });
        if (!loadRes.ok) {
          setHasHydrated(true);
          return;
        }

        const payload = await loadRes.json();
        if (payload?.success && payload?.data) {
          isApplyingCloudData.current = true;
          applyDataToState(payload.data);
          setTimeout(() => {
            isApplyingCloudData.current = false;
          }, 0);
        }

        setCloudSyncStatus('saved');
        setLastCloudSyncAt(new Date());
      } catch (error) {
        console.warn('Cloud init skipped:', error);
        setCloudSyncStatus('error');
      } finally {
        setHasHydrated(true);
      }
    };

    initializeData();
  }, [applyDataToState]);

  const handleSetRole = useCallback((role: UserRole, stayLoggedIn: boolean) => {
    setUserRole(role);
    if (stayLoggedIn && role) {
      localStorage.setItem('promptmetal_role', role);
    }
  }, []);

  const handleAddTransaction = useCallback((newTransaction: Transaction) => {
    databaseService.saveTransaction(newTransaction);
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const handleUpdateTransaction = useCallback((updatedTransaction: Transaction) => {
    databaseService.saveTransaction(updatedTransaction);
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  }, []);

  const handleDeleteTransaction = useCallback((id: string) => {
    databaseService.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAddProject = useCallback((newProject: Project) => {
    databaseService.saveProject(newProject);
    setProjects(prev => [newProject, ...prev]);
  }, []);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    databaseService.saveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const handleDeleteProject = useCallback((id: string) => {
    databaseService.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
      setCurrentView('projects');
    }
  }, [selectedProjectId]);

  const handleAddEmployee = useCallback((newEmployee: Employee) => {
    databaseService.saveEmployee(newEmployee);
    setEmployees(prev => [...prev, newEmployee]);
  }, []);

  const handleUpdateEmployee = useCallback((updatedEmployee: Employee) => {
    databaseService.saveEmployee(updatedEmployee);
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  }, []);

  const handleDeleteEmployee = useCallback((id: string) => {
    databaseService.deleteEmployee(id);
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  }, []);

  const handleUpdateVehicles = useCallback((updatedVehicles: Vehicle[]) => {
    databaseService.saveVehicles(updatedVehicles);
    setVehicles(updatedVehicles);
  }, []);

  const handleAddTimesheetBatch = useCallback((newRecords: TimesheetRecord[]) => {
    databaseService.saveTimesheets(newRecords);
    setTimesheetRecords(prev => [...newRecords, ...prev]);
  }, []);

  const handleDeleteTimesheet = useCallback((id: string) => {
    databaseService.deleteTimesheet(id);
    setTimesheetRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleAddScheduleTask = useCallback((newTask: ScheduleTask) => {
    databaseService.saveScheduleTask(newTask);
    setScheduleTasks(prev => [newTask, ...prev]);
  }, []);

  const handleUpdateScheduleTask = useCallback((updatedTask: ScheduleTask) => {
    databaseService.saveScheduleTask(updatedTask);
    setScheduleTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  }, []);

  const handleAddNote = useCallback((newNote: DailyNote) => {
    databaseService.saveNote(newNote);
    setNotes(prev => [newNote, ...prev]);
  }, []);

  const handleUpdateNote = useCallback((updatedNote: DailyNote) => {
    databaseService.saveNote(updatedNote);
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    databaseService.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
  }, []);

  const handleLogout = useCallback(() => {
    setUserRole(null);
    setCurrentView('home');
    localStorage.removeItem('promptmetal_role');
  }, []);

  const handleViewChange = useCallback((view: ViewState) => {
    setCurrentView(view);
  }, []);

  // Auto-save no Firestore (quando Google estiver conectado)
  useEffect(() => {
    if (!hasHydrated || !isCloudConnected || isApplyingCloudData.current) return;

    setCloudSyncStatus('saving');

    const timer = setTimeout(async () => {
      try {
        const saveRes = await fetch('/api/data/save', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: databaseService.getAllData() })
        });

        if (!saveRes.ok) {
          setCloudSyncStatus('error');
          return;
        }

        setCloudSyncStatus('saved');
        setLastCloudSyncAt(new Date());
      } catch (error) {
        console.error('Cloud save failed:', error);
        setCloudSyncStatus('error');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [hasHydrated, isCloudConnected, projects, transactions, employees, vehicles, timesheetRecords, scheduleTasks, notes]);

  // Automatic Backup to Google Drive
  useEffect(() => {
    if (!hasHydrated || !isCloudConnected) return;

    const triggerBackup = async () => {
      try {
        const data = databaseService.getAllData();
        await fetch('/api/drive/backup', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data,
            filename: `auto_backup_${new Date().toISOString().split('T')[0]}.json`
          })
        });
        console.log("Automatic backup completed");
      } catch (error) {
        console.error("Auto-backup failed:", error);
      }
    };

    // Trigger backup after a delay when projects or transactions change
    const timer = setTimeout(triggerBackup, 5000); // 5 seconds delay
    return () => clearTimeout(timer);
  }, [hasHydrated, isCloudConnected, projects, transactions, employees, vehicles, timesheetRecords, scheduleTasks, notes]);

  // Atualiza status de conexão ao voltar foco para a aba
  useEffect(() => {
    const refreshCloudStatus = async () => {
      try {
        const statusRes = await fetch('/api/auth/google/status', { credentials: 'include' });
        if (!statusRes.ok) {
          setIsCloudConnected(false);
          setCloudSyncStatus('offline');
          return;
        }

        const { connected } = await statusRes.json();
        setIsCloudConnected(!!connected);
        setCloudSyncStatus(connected ? 'idle' : 'offline');
      } catch {
        setIsCloudConnected(false);
        setCloudSyncStatus('offline');
      }
    };

    window.addEventListener('focus', refreshCloudStatus);
    return () => window.removeEventListener('focus', refreshCloudStatus);
  }, []);

  const handleRefreshData = useCallback(() => {
    setProjects(databaseService.getProjects());
    setTransactions(databaseService.getTransactions());
    setEmployees(databaseService.getEmployees());
    setVehicles(databaseService.getVehicles());
    setTimesheetRecords(databaseService.getTimesheets());
    setScheduleTasks(databaseService.getScheduleTasks());
    setNotes(databaseService.getNotes());
  }, []);

  const activeProject = useMemo(() =>
    projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]);

  const cloudStatusLabel = useMemo(() => {
    if (!hasHydrated) return 'Sincronização: inicializando';

    switch (cloudSyncStatus) {
      case 'offline':
        return 'Sincronização: desconectado';
      case 'saving':
        return 'Sincronização: salvando...';
      case 'saved':
        return `Sincronização: salvo${lastCloudSyncAt ? ` às ${lastCloudSyncAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}`;
      case 'error':
        return 'Sincronização: erro ao salvar';
      default:
        return 'Sincronização: aguardando alterações';
    }
  }, [hasHydrated, cloudSyncStatus, lastCloudSyncAt]);

  const cloudStatusClass = useMemo(() => {
    switch (cloudSyncStatus) {
      case 'offline':
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'saving':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'saved':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  }, [cloudSyncStatus]);

  if (!userRole) return <RoleSelection onSelect={handleSetRole} />;

  if (currentView === 'home') return (
    <HomeLanding
      onNavigate={handleViewChange}
      userRole={userRole}
      projects={projects}
      transactions={transactions}
      employees={employees}
      vehicles={vehicles}
    />
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard projects={projects} transactions={transactions} vehicles={vehicles} employees={employees} notes={notes} userRole={userRole} onNavigate={handleViewChange} />;
      case 'projects': return (
        <ProjectsView
          projects={projects}
          transactions={transactions}
          employees={employees}
          onAddProject={handleAddProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onSelectProject={handleSelectProject}
          userRole={userRole}
        />
      );
      case 'schedule': return <ScheduleView tasks={scheduleTasks} projects={projects} onAddTask={handleAddScheduleTask} onUpdateTask={handleUpdateScheduleTask} userRole={userRole} />;
      case 'project-detail':
        if (activeProject) {
          return <ProjectDetailView project={activeProject} onBack={() => setCurrentView('projects')} userRole={userRole} employees={employees} onUpdateProject={handleUpdateProject} />;
        } else {
          return <div className="text-center p-8"><h2 className="text-xl font-bold">Projeto não encontrado.</h2><p>Por favor, volte para a lista de projetos e tente novamente.</p><button onClick={() => setCurrentView('projects')} className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-lg">Voltar</button></div>;
        }
      case 'finance': return <FinanceView transactions={transactions} projects={projects} userRole={userRole} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case 'fleet': return <FleetView vehicles={vehicles} onUpdateVehicles={handleUpdateVehicles} userRole={userRole} />;
      case 'team': return <TeamView userRole={userRole} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} employees={employees} projects={projects} />;
      case 'timesheet': return <TimesheetView employees={employees} projects={projects} records={timesheetRecords} onAddBatch={handleAddTimesheetBatch} onDeleteRecord={handleDeleteTimesheet} userRole={userRole} />;
      case 'corporate-cards': return <CorporateCardView employees={employees} onUpdateEmployee={handleUpdateEmployee} userRole={userRole} />;
      case 'notes': return <NotesView notes={notes} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} userRole={userRole} />;
      case 'settings': return <SettingsView onImportSuccess={handleRefreshData} />;
      case 'ai-analysis': return <AIAdvisor projects={projects} transactions={transactions} fleet={vehicles} />;
      default: return <Dashboard projects={projects} transactions={transactions} userRole={userRole} onNavigate={handleViewChange} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onChangeView={handleViewChange} userRole={userRole} onLogout={handleLogout} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex justify-end">
            <div className={`text-xs px-3 py-1 rounded-full border ${cloudStatusClass}`}>
              {cloudStatusLabel}
            </div>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
