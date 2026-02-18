
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectsView from './components/ProjectsView';
import ProjectDetailView from './components/ProjectDetailView';
import FinanceView from './components/FinanceView';
import FleetView from './components/FleetView';
import ComplianceView from './components/ComplianceView';
import TeamView from './components/TeamView';
import TimesheetView from './components/TimesheetView';
import CorporateCardView from './components/CorporateCardView';
import HomeLanding from './components/HomeLanding';
import RoleSelection from './components/RoleSelection';
import ScheduleView from './components/ScheduleView';
import { ViewState, Transaction, Project, Employee, UserRole, Vehicle, TimesheetRecord, ScheduleTask, ChecklistItem } from './types';
import {
  MOCK_PROJECTS,
  MOCK_TRANSACTIONS,
  MOCK_VEHICLES,
  MOCK_EMPLOYEES,
  MOCK_TIMESHEET_RECORDS
} from './src/constants';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');

  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [timesheetRecords, setTimesheetRecords] = useState<TimesheetRecord[]>(MOCK_TIMESHEET_RECORDS);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [complianceItems, setComplianceItems] = useState<ChecklistItem[]>([
    { id: '1', text: "Alvará de funcionamento válido (Sede)", checked: true, critical: true, deadline: '2025-12-28' },
    { id: '2', text: "PPRA e PCMSO atualizados", checked: true, critical: true, deadline: '2025-10-15' },
    { id: '3', text: "Manual de Operações da Franquia (V.2025)", checked: true, critical: false, deadline: '2025-11-20' },
  ]);

  useEffect(() => {
    const savedRole = localStorage.getItem('promptmetal_role') as UserRole;
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  const handleSetRole = useCallback((role: UserRole, stayLoggedIn: boolean) => {
    setUserRole(role);
    if (stayLoggedIn && role) {
      localStorage.setItem('promptmetal_role', role);
    }
  }, []);

  const handleAddTransaction = useCallback((newTransaction: Transaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const handleUpdateTransaction = useCallback((updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  }, []);

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAddProject = useCallback((newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
  }, []);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const handleAddEmployee = useCallback((newEmployee: Employee) => {
    setEmployees(prev => [...prev, newEmployee]);
  }, []);

  const handleUpdateEmployee = useCallback((updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  }, []);

  const handleUpdateVehicles = useCallback((updatedVehicles: Vehicle[]) => {
    setVehicles(updatedVehicles);
  }, []);

  const handleAddTimesheetRecord = useCallback((newRecord: TimesheetRecord) => {
    setTimesheetRecords(prev => [newRecord, ...prev]);
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

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard
          projects={projects}
          transactions={transactions}
          vehicles={vehicles}
          employees={employees}
          complianceItems={complianceItems}
          userRole={userRole}
          onNavigate={handleViewChange}
        />;
      case 'projects':
        return <ProjectsView
          projects={projects}
          onAddProject={handleAddProject}
          onSelectProject={handleSelectProject}
          userRole={userRole}
        />;
      case 'schedule':
        return <ScheduleView
          tasks={scheduleTasks}
          projects={projects}
          onAddTask={handleAddScheduleTask}
          onUpdateTask={handleUpdateScheduleTask}
          userRole={userRole}
        />;
      case 'project-detail':
        if (activeProject) {
          return <ProjectDetailView
            project={activeProject}
            onBack={() => setCurrentView('projects')}
            userRole={userRole}
            employees={employees}
            onUpdateProject={handleUpdateProject}
          />;
        }
        return <ProjectsView projects={projects} onAddProject={handleAddProject} onSelectProject={handleSelectProject} userRole={userRole} />;
      case 'finance':
        return <FinanceView
          transactions={transactions}
          projects={projects}
          userRole={userRole}
          onAddTransaction={handleAddTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />;
      case 'fleet':
        return <FleetView vehicles={vehicles} onUpdateVehicles={handleUpdateVehicles} userRole={userRole} />;
      case 'team':
        return <TeamView
          userRole={userRole}
          onAddEmployee={handleAddEmployee}
          employees={employees}
          timesheetRecords={timesheetRecords}
          projects={projects}
        />;
      case 'timesheet':
        return <TimesheetView
          employees={employees}
          projects={projects}
          records={timesheetRecords}
          onAddRecord={handleAddTimesheetRecord}
          userRole={userRole}
        />;
      case 'corporate-cards':
        return <CorporateCardView
          employees={employees}
          onUpdateEmployee={handleUpdateEmployee}
          userRole={userRole}
        />;
      case 'compliance':
        return <ComplianceView userRole={userRole} items={complianceItems} onSetItems={setComplianceItems} />;
      default:
        return <Dashboard
          projects={projects}
          transactions={transactions}
          vehicles={vehicles}
          employees={employees}
          complianceItems={complianceItems}
          userRole={userRole}
          onNavigate={handleViewChange}
        />;
    }
  };

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        currentView={currentView}
        onChangeView={handleViewChange}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
