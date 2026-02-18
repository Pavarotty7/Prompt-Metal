
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
  const [complianceItems, setComplianceItems] = useState<ChecklistItem[]>([]);

  // Carregar dados iniciais do Local Storage
  useEffect(() => {
    const savedRole = localStorage.getItem('promptmetal_role') as UserRole;
    if (savedRole) setUserRole(savedRole);

    setProjects(databaseService.getProjects());
    setTransactions(databaseService.getTransactions());
    setEmployees(databaseService.getEmployees());
    setVehicles(databaseService.getVehicles());
    setTimesheetRecords(databaseService.getTimesheets());
    setComplianceItems(databaseService.getCompliance());
  }, []);

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

  const handleLogout = useCallback(() => {
    setUserRole(null);
    setCurrentView('home');
    localStorage.removeItem('promptmetal_role');
  }, []);

  const handleViewChange = useCallback((view: ViewState) => {
    setCurrentView(view);
  }, []);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [projects, selectedProjectId]);

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
      case 'dashboard': return <Dashboard projects={projects} transactions={transactions} vehicles={vehicles} employees={employees} complianceItems={complianceItems} userRole={userRole} onNavigate={handleViewChange} />;
      case 'projects': return (
        <ProjectsView 
          projects={projects} 
          transactions={transactions}
          complianceItems={complianceItems}
          employees={employees}
          onAddProject={handleAddProject} 
          onSelectProject={handleSelectProject} 
          userRole={userRole} 
        />
      );
      case 'schedule': return <ScheduleView tasks={scheduleTasks} projects={projects} onAddTask={handleAddScheduleTask} onUpdateTask={handleUpdateScheduleTask} userRole={userRole} />;
      case 'project-detail': return activeProject ? <ProjectDetailView project={activeProject} onBack={() => setCurrentView('projects')} userRole={userRole} employees={employees} onUpdateProject={handleUpdateProject} /> : <ProjectsView projects={projects} onAddProject={handleAddProject} onSelectProject={handleSelectProject} userRole={userRole} />;
      case 'finance': return <FinanceView transactions={transactions} projects={projects} userRole={userRole} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case 'fleet': return <FleetView vehicles={vehicles} onUpdateVehicles={handleUpdateVehicles} userRole={userRole} />;
      case 'team': return <TeamView userRole={userRole} onAddEmployee={handleAddEmployee} employees={employees} projects={projects} />;
      case 'timesheet': return <TimesheetView employees={employees} projects={projects} records={timesheetRecords} onAddBatch={handleAddTimesheetBatch} onDeleteRecord={handleDeleteTimesheet} userRole={userRole} />;
      case 'corporate-cards': return <CorporateCardView employees={employees} onUpdateEmployee={handleUpdateEmployee} userRole={userRole} />;
      case 'compliance': return <ComplianceView userRole={userRole} items={complianceItems} onSetItems={handleSetComplianceItems} />;
      case 'ai-analysis': return <AIAdvisor projects={projects} transactions={transactions} fleet={vehicles} />;
      default: return <Dashboard projects={projects} transactions={transactions} userRole={userRole} onNavigate={handleViewChange} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onChangeView={handleViewChange} userRole={userRole} onLogout={handleLogout} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
