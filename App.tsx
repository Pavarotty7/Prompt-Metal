
import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { ViewState, Transaction, Project, Employee, UserRole, Vehicle, TimesheetRecord, ScheduleTask, DailyNote, ProjectStatus } from './types';
import { databaseService } from './services/databaseService';

const VALID_VIEWS: ViewState[] = [
  'home',
  'dashboard',
  'projects',
  'schedule',
  'finance',
  'fleet',
  'ai-analysis',
  'team',
  'project-detail',
  'timesheet',
  'corporate-cards',
  'notes'
];

const isValidViewState = (view: string): view is ViewState => VALID_VIEWS.includes(view as ViewState);

const normalizeProjects = (input: Project[]): Project[] => {
  return (input || []).filter((project): project is Project => Boolean(project)).map((project) => ({
    ...project,
    id: project.id || Math.random().toString(36).substr(2, 9),
    name: project.name || 'Projeto sem nome',
    client: project.client || 'Cliente não informado',
    address: project.address || '',
    responsible: project.responsible || '',
    startDate: project.startDate || '',
    endDate: project.endDate || '',
    budget: Number.isFinite(project.budget) ? project.budget : 0,
    spent: Number.isFinite(project.spent) ? project.spent : 0,
    progress: Number.isFinite(project.progress) ? project.progress : 0,
    status: project.status || ProjectStatus.PLANNED,
    category: project.category || 'Industrial',
    priority: project.priority || 'Normal'
  }));
};

const normalizeNotes = (input: DailyNote[]): DailyNote[] => {
  return (input || []).filter((note): note is DailyNote => Boolean(note)).map((note) => ({
    ...note,
    id: note.id || Math.random().toString(36).substr(2, 9),
    date: note.date || new Date().toISOString().split('T')[0],
    content: typeof note.content === 'string' ? note.content : '',
    priority: note.priority || 'Média',
    completed: Boolean(note.completed)
  }));
};

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

  // Carregar dados iniciais do Local Storage
  useEffect(() => {
    const savedRole = localStorage.getItem('promptmetal_role') as UserRole;
    if (savedRole) setUserRole(savedRole);

    setProjects(normalizeProjects(databaseService.getProjects()));
    setTransactions(databaseService.getTransactions());
    setEmployees(databaseService.getEmployees());
    setVehicles(databaseService.getVehicles());
    setTimesheetRecords(databaseService.getTimesheets());
    setNotes(normalizeNotes(databaseService.getNotes()));
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

  const handleAddScheduleTask = useCallback((newTask: ScheduleTask) => {
    setScheduleTasks(prev => [newTask, ...prev]);
  }, []);

  const handleUpdateScheduleTask = useCallback((updatedTask: ScheduleTask) => {
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
    if (!isValidViewState(view)) {
      setCurrentView('home');
      return;
    }

    if (view === 'project-detail' && !selectedProjectId) {
      setCurrentView('projects');
      return;
    }

    setCurrentView(view);
  }, [selectedProjectId]);

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
      case 'dashboard': return <Dashboard projects={projects} transactions={transactions} vehicles={vehicles} employees={employees} notes={notes} userRole={userRole} onNavigate={handleViewChange} />;
      case 'projects': return (
        <ProjectsView
          projects={projects}
          transactions={transactions}
          employees={employees}
          onAddProject={handleAddProject}
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
      case 'team': return <TeamView userRole={userRole} onAddEmployee={handleAddEmployee} employees={employees} projects={projects} />;
      case 'timesheet': return <TimesheetView employees={employees} projects={projects} records={timesheetRecords} onAddBatch={handleAddTimesheetBatch} onDeleteRecord={handleDeleteTimesheet} userRole={userRole} />;
      case 'corporate-cards': return <CorporateCardView employees={employees} onUpdateEmployee={handleUpdateEmployee} userRole={userRole} />;
      case 'notes': return <NotesView notes={notes} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} userRole={userRole} />;
      case 'ai-analysis': return <AIAdvisor projects={projects} transactions={transactions} fleet={vehicles} />;
      default: return <Dashboard projects={projects} transactions={transactions} vehicles={vehicles} employees={employees} notes={notes} userRole={userRole} onNavigate={handleViewChange} />;
    }
  };

  return (
    <div className="grid grid-cols-[256px_1fr] min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onChangeView={handleViewChange} userRole={userRole} onLogout={handleLogout} />
      <main className="p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
