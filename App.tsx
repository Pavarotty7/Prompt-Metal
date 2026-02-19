
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectsView from './components/ProjectsView';
import ProjectDetailView from './components/ProjectDetailView';
import FinanceView from './components/FinanceView';
import FleetView from './components/FleetView';
import ComplianceView from './components/ComplianceView';
import AIAdvisor from './components/AIAdvisor';
import TeamView from './components/TeamView';
import TimesheetView from './components/TimesheetView';
import CorporateCardView from './components/CorporateCardView';
import HomeLanding from './components/HomeLanding';
import RoleSelection from './components/RoleSelection';
import ScheduleView from './components/ScheduleView';
import { ViewState, Transaction, Project, Employee, UserRole, Vehicle, TimesheetRecord, ScheduleTask, ChecklistItem } from './types';
import { databaseService } from './services/databaseService';
import { AlertTriangle, Download, LogOut, X } from 'lucide-react';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [timesheetRecords, setTimesheetRecords] = useState<TimesheetRecord[]>([]);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [complianceItems, setComplianceItems] = useState<ChecklistItem[]>([]);

  const loadAllData = useCallback(() => {
    const savedRole = localStorage.getItem('promptmetal_role') as UserRole;
    if (savedRole) setUserRole(savedRole);

    setProjects(databaseService.getProjects());
    setTransactions(databaseService.getTransactions());
    setEmployees(databaseService.getEmployees());
    setVehicles(databaseService.getVehicles());
    setTimesheetRecords(databaseService.getTimesheets());
    setComplianceItems(databaseService.getCompliance());
  }, []);

  // Carregar dados iniciais do Local Storage
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRefreshData = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

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
  }, []);

  const handleAddEmployee = useCallback((newEmployee: Employee) => {
    databaseService.saveEmployee(newEmployee);
    setEmployees(prev => [...prev, newEmployee]);
  }, []);

  const handleUpdateEmployee = useCallback((updatedEmployee: Employee) => {
    databaseService.saveEmployee(updatedEmployee);
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  }, []);

  const handleUpdateVehicles = useCallback((updatedVehicles: Vehicle[]) => {
    databaseService.saveVehicles(updatedVehicles);
    setVehicles(updatedVehicles);
  }, []);

  const handleDeleteVehicle = useCallback((id: string) => {
    databaseService.deleteVehicle(id);
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const handleAddTimesheetBatch = useCallback((newRecords: TimesheetRecord[]) => {
    databaseService.saveTimesheets(newRecords);
    setTimesheetRecords(prev => [...newRecords, ...prev]);
  }, []);

  const handleDeleteTimesheet = useCallback((id: string) => {
    databaseService.deleteTimesheet(id);
    setTimesheetRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleSetComplianceItems = useCallback((items: ChecklistItem[]) => {
    databaseService.saveCompliance(items);
    setComplianceItems(items);
  }, []);

  const handleAddScheduleTask = useCallback((newTask: ScheduleTask) => {
    setScheduleTasks(prev => [newTask, ...prev]);
  }, []);

  const handleUpdateScheduleTask = useCallback((updatedTask: ScheduleTask) => {
    setScheduleTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  }, []);

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
  }, []);

  const performLogout = useCallback(() => {
    setUserRole(null);
    setCurrentView('home');
    setIsLogoutModalOpen(false);
    localStorage.removeItem('promptmetal_role');
  }, []);

  const handleBackupAndLogout = useCallback(() => {
    const data = databaseService.exportDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PromptMetal_Final_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Pequeno delay para garantir que o download inicie antes de limpar o estado
    setTimeout(performLogout, 500);
  }, [performLogout]);

  const handleLogoutClick = useCallback(() => {
    // Se não houver dados, sai direto. Se houver, pergunta do backup.
    if (projects.length === 0 && transactions.length === 0) {
      performLogout();
    } else {
      setIsLogoutModalOpen(true);
    }
  }, [projects.length, transactions.length, performLogout]);

  const handleViewChange = useCallback((view: ViewState) => {
    setCurrentView(view);
  }, []);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [projects, selectedProjectId]);

  if (!userRole) return <RoleSelection onSelect={handleSetRole} />;
  
  if (currentView === 'home') return (
    <>
      <HomeLanding 
        onNavigate={handleViewChange} 
        userRole={userRole} 
        projects={projects}
        transactions={transactions}
        employees={employees}
        vehicles={vehicles}
      />
      {/* Botão flutuante de saída na home para convidados/admin */}
      <button 
        onClick={handleLogoutClick}
        className="fixed bottom-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-full hover:bg-red-500 transition-all shadow-2xl z-[100] group"
      >
        <LogOut size={24} className="group-hover:scale-110 transition-transform" />
      </button>
      {isLogoutModalOpen && (
        <LogoutConfirmationModal 
          onCancel={() => setIsLogoutModalOpen(false)} 
          onConfirmLogout={performLogout} 
          onBackupAndLogout={handleBackupAndLogout} 
        />
      )}
    </>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard projects={projects} transactions={transactions} vehicles={vehicles} employees={employees} complianceItems={complianceItems} userRole={userRole} onNavigate={handleViewChange} onRefreshData={handleRefreshData} />;
      case 'projects': return (
        <ProjectsView 
          projects={projects} 
          transactions={transactions}
          complianceItems={complianceItems}
          employees={employees}
          onAddProject={handleAddProject} 
          onDeleteProject={handleDeleteProject}
          onSelectProject={handleSelectProject} 
          userRole={userRole} 
        />
      );
      case 'schedule': return <ScheduleView tasks={scheduleTasks} projects={projects} onAddTask={handleAddScheduleTask} onUpdateTask={handleUpdateScheduleTask} userRole={userRole} />;
      case 'project-detail': return activeProject ? <ProjectDetailView project={activeProject} onBack={() => setCurrentView('projects')} userRole={userRole} employees={employees} onUpdateProject={handleUpdateProject} /> : <ProjectsView projects={projects} onAddProject={handleAddProject} onSelectProject={handleSelectProject} userRole={userRole} />;
      case 'finance': return <FinanceView transactions={transactions} projects={projects} userRole={userRole} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case 'fleet': return <FleetView vehicles={vehicles} onUpdateVehicles={handleUpdateVehicles} onDeleteVehicle={handleDeleteVehicle} userRole={userRole} />;
      case 'team': return <TeamView userRole={userRole} onAddEmployee={handleAddEmployee} employees={employees} projects={projects} />;
      case 'timesheet': return <TimesheetView employees={employees} projects={projects} records={timesheetRecords} onAddBatch={handleAddTimesheetBatch} onDeleteRecord={handleDeleteTimesheet} userRole={userRole} />;
      case 'corporate-cards': return <CorporateCardView employees={employees} onUpdateEmployee={handleUpdateEmployee} userRole={userRole} />;
      case 'compliance': return <ComplianceView userRole={userRole} items={complianceItems} onSetItems={handleSetComplianceItems} />;
      case 'ai-analysis': return <AIAdvisor projects={projects} transactions={transactions} fleet={vehicles} onRefreshData={handleRefreshData} />;
      default: return <Dashboard projects={projects} transactions={transactions} userRole={userRole} onNavigate={handleViewChange} onRefreshData={handleRefreshData} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onChangeView={handleViewChange} userRole={userRole} onLogout={handleLogoutClick} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>

      {isLogoutModalOpen && (
        <LogoutConfirmationModal 
          onCancel={() => setIsLogoutModalOpen(false)} 
          onConfirmLogout={performLogout} 
          onBackupAndLogout={handleBackupAndLogout} 
        />
      )}
    </div>
  );
};

// Componente Interno de Modal para organização
const LogoutConfirmationModal: React.FC<{
  onCancel: () => void;
  onConfirmLogout: () => void;
  onBackupAndLogout: () => void;
}> = ({ onCancel, onConfirmLogout, onBackupAndLogout }) => (
  <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
    <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 animate-scale-in">
      <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8">
        <AlertTriangle size={48} strokeWidth={2.5} />
      </div>
      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">Salvar progresso?</h3>
      <p className="text-slate-600 text-sm mb-10 leading-relaxed font-medium italic">
        Deseja realizar um <span className="text-slate-950 font-black">Backup Total</span> dos seus dados antes de encerrar a sessão? Isso garante que você não perca os últimos lançamentos.
      </p>
      
      <div className="space-y-3">
        <button 
          onClick={onBackupAndLogout}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 border border-emerald-500/30"
        >
          <Download size={18} className="text-emerald-500" /> Backup e Sair
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onCancel}
            className="py-4 bg-slate-100 text-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirmLogout}
            className="py-4 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 rounded-xl transition-all border border-red-100"
          >
            Sair sem Salvar
          </button>
        </div>
      </div>
      
      <button 
        onClick={onCancel}
        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
      >
        <X size={24} />
      </button>
    </div>
  </div>
);

export default App;
