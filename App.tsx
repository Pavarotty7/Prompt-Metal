
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, where, writeBatch, setDoc } from 'firebase/firestore';
import { db, auth } from './services/firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
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
import { MOCK_PROJECTS, MOCK_TRANSACTIONS, MOCK_VEHICLES, MOCK_EMPLOYEES, MOCK_TIMESHEET_RECORDS } from './constants';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [timesheetRecords, setTimesheetRecords] = useState<TimesheetRecord[]>([]);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [complianceItems, setComplianceItems] = useState<ChecklistItem[]>([]);

  // Monitorar autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Carregar role do Firestore ou localStorage
        const savedRole = localStorage.getItem('promptmetal_role') as UserRole;
        if (savedRole) {
          setUserRole(savedRole);
        }
      } else {
        setUserRole(null);
        setCurrentView('home');
        localStorage.removeItem('promptmetal_role');
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user role from localStorage (fallback)
  useEffect(() => {
    if (!currentUser) {
      const savedRole = localStorage.getItem('promptmetal_role') as UserRole;
      if (savedRole) {
        setUserRole(savedRole);
      }
    }
  }, [currentUser]);

  // Sync Transactions from Firestore (real-time listener)
  useEffect(() => {
    if (!currentUser) {
      setTransactions(MOCK_TRANSACTIONS);
      return;
    }
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data.length > 0 ? data : MOCK_TRANSACTIONS);
    }, (error) => {
      console.log('Using mock transactions (Firestore unavailable):', error);
      setTransactions(MOCK_TRANSACTIONS);
    });
    return unsubscribe;
  }, [currentUser]);

  // Sync Projects from Firestore (real-time listener)
  useEffect(() => {
    if (!currentUser) {
      setProjects(MOCK_PROJECTS);
      return;
    }
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(data.length > 0 ? data : MOCK_PROJECTS);
    }, (error) => {
      console.log('Using mock projects (Firestore unavailable):', error);
      setProjects(MOCK_PROJECTS);
    });
    return unsubscribe;
  }, [currentUser]);

  // Sync Employees from Firestore (real-time listener)
  useEffect(() => {
    if (!currentUser) {
      setEmployees(MOCK_EMPLOYEES);
      return;
    }
    const q = query(
      collection(db, 'employees'),
      where('userId', '==', currentUser.uid),
      orderBy('name', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(data.length > 0 ? data : MOCK_EMPLOYEES);
    }, (error) => {
      console.log('Using mock employees (Firestore unavailable):', error);
      setEmployees(MOCK_EMPLOYEES);
    });
    return unsubscribe;
  }, [currentUser]);

  // Sync Vehicles from Firestore (real-time listener)
  useEffect(() => {
    if (!currentUser) {
      setVehicles(MOCK_VEHICLES);
      return;
    }
    const q = query(
      collection(db, 'vehicles'),
      where('userId', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(data.length > 0 ? data : MOCK_VEHICLES);
    }, (error) => {
      console.log('Using mock vehicles (Firestore unavailable):', error);
      setVehicles(MOCK_VEHICLES);
    });
    return unsubscribe;
  }, [currentUser]);

  // Sync Schedule Tasks from Firestore (real-time listener)
  useEffect(() => {
    if (!currentUser) {
      setScheduleTasks([]);
      return;
    }
    const q = query(
      collection(db, 'scheduleTasks'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleTask));
      setScheduleTasks(data);
    }, (error) => {
      console.log('Firestore unavailable for schedule tasks:', error);
    });
    return unsubscribe;
  }, [currentUser]);

  // Sync Timesheet Records from Firestore (real-time listener)
  useEffect(() => {
    if (!currentUser) {
      setTimesheetRecords(MOCK_TIMESHEET_RECORDS);
      return;
    }
    const q = query(
      collection(db, 'timesheetRecords'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimesheetRecord));
      setTimesheetRecords(data.length > 0 ? data : MOCK_TIMESHEET_RECORDS);
    }, (error) => {
      console.log('Using mock timesheet records (Firestore unavailable):', error);
      setTimesheetRecords(MOCK_TIMESHEET_RECORDS);
    });
    return unsubscribe;
  }, [currentUser]);

  // Sync Compliance Items from Firestore (real-time listener)
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    const docRef = doc(db, 'compliance', currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setComplianceItems(data.items || []);
      }
    }, (error) => {
      console.log('Firestore unavailable for compliance:', error);
    });
    return unsubscribe;
  }, [currentUser]);

  const handleSetRole = useCallback((role: UserRole, stayLoggedIn: boolean) => {
    setUserRole(role);
    if (stayLoggedIn && role) {
      localStorage.setItem('promptmetal_role', role);
    }
  }, []);

<<<<<<< HEAD
  const handleAddTransaction = useCallback(async (newTransaction: Transaction) => {
    if (!currentUser) {
      console.error('User must be authenticated to add transactions');
      return;
    }
    try {
      await addDoc(collection(db, 'transactions'), {
        ...newTransaction,
        id: undefined, // Firestore will generate the ID
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      setTransactions(prev => [newTransaction, ...prev]); // Fallback to local state
    }
  }, [currentUser]);

  const handleUpdateTransaction = useCallback(async (updatedTransaction: Transaction) => {
    if (!currentUser) {
      console.error('User must be authenticated to update transactions');
      return;
    }
    try {
      const docRef = doc(db, 'transactions', updatedTransaction.id);
      await updateDoc(docRef, {
        ...updatedTransaction,
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    }
  }, [currentUser]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!currentUser) {
      console.error('User must be authenticated to delete transactions');
      return;
    }
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  }, [currentUser]);

  const handleAddProject = useCallback(async (newProject: Project) => {
    if (!currentUser) {
      console.error('User must be authenticated to add projects');
      return;
    }
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        id: undefined,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding project:', error);
      setProjects(prev => [newProject, ...prev]);
    }
  }, [currentUser]);

  const handleUpdateProject = useCallback(async (updatedProject: Project) => {
    if (!currentUser) {
      console.error('User must be authenticated to update projects');
      return;
    }
    try {
      const docRef = doc(db, 'projects', updatedProject.id);
      await updateDoc(docRef, {
        ...updatedProject,
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error updating project:', error);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  }, [currentUser]);

  const handleAddEmployee = useCallback(async (newEmployee: Employee) => {
    if (!currentUser) {
      console.error('User must be authenticated to add employees');
      return;
    }
    try {
      await addDoc(collection(db, 'employees'), {
        ...newEmployee,
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      setEmployees(prev => [...prev, newEmployee]);
    }
  }, [currentUser]);

  const handleUpdateEmployee = useCallback(async (updatedEmployee: Employee) => {
    if (!currentUser) {
      console.error('User must be authenticated to update employees');
      return;
    }
    try {
      const docRef = doc(db, 'employees', updatedEmployee.id);
      await updateDoc(docRef, {
        ...updatedEmployee,
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
    }
  }, [currentUser]);

  const handleUpdateVehicles = useCallback(async (updatedVehicles: Vehicle[]) => {
    if (!currentUser) {
      console.error('User must be authenticated to update vehicles');
      return;
    }
    try {
      // For bulk updates, you might want to update each doc individually or use batch writes
      for (const vehicle of updatedVehicles) {
        const docRef = doc(db, 'vehicles', vehicle.id);
        await updateDoc(docRef, {
          ...vehicle,
          userId: currentUser.uid
        });
      }
    } catch (error) {
      console.error('Error updating vehicles:', error);
      setVehicles(updatedVehicles);
    }
  }, [currentUser]);

  const handleAddTimesheetRecord = useCallback(async (newRecord: TimesheetRecord) => {
    if (!currentUser) {
      console.error('User must be authenticated to add timesheet records');
      return;
    }
    try {
      await addDoc(collection(db, 'timesheetRecords'), {
        ...newRecord,
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error adding timesheet record:', error);
      setTimesheetRecords(prev => [newRecord, ...prev]);
    }
  }, [currentUser]);

  const handleAddTimesheetBatch = useCallback(async (newRecords: TimesheetRecord[]) => {
    if (!currentUser) {
      console.error('User must be authenticated to add timesheet records');
      return;
    }
    try {
      const batch = writeBatch(db);
      newRecords.forEach(record => {
        const docRef = doc(collection(db, 'timesheetRecords'));
        batch.set(docRef, {
          ...record,
          userId: currentUser.uid
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error adding timesheet batch:', error);
      setTimesheetRecords(prev => [...newRecords, ...prev]);
    }
  }, [currentUser]);

  const handleDeleteTimesheet = useCallback(async (id: string) => {
    if (!currentUser) {
      console.error('User must be authenticated to delete timesheet records');
      return;
    }
    try {
      await deleteDoc(doc(db, 'timesheetRecords', id));
    } catch (error) {
      console.error('Error deleting timesheet record:', error);
      setTimesheetRecords(prev => prev.filter(r => r.id !== id));
    }
  }, [currentUser]);

  const handleSetComplianceItems = useCallback(async (items: ChecklistItem[]) => {
    if (!currentUser) {
      console.error('User must be authenticated to update compliance');
      return;
    }
    try {
      const docRef = doc(db, 'compliance', currentUser.uid);
      await setDoc(docRef, { items, userId: currentUser.uid });
      setComplianceItems(items);
    } catch (error) {
      console.error('Error saving compliance:', error);
      setComplianceItems(items);
    }
  }, [currentUser]);

  const handleAddScheduleTask = useCallback(async (newTask: ScheduleTask) => {
    if (!currentUser) {
      console.error('User must be authenticated to add schedule tasks');
      return;
    }
    try {
      await addDoc(collection(db, 'scheduleTasks'), {
        ...newTask,
        id: undefined,
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error adding schedule task:', error);
      setScheduleTasks(prev => [newTask, ...prev]);
    }
  }, [currentUser]);

  const handleUpdateScheduleTask = useCallback(async (updatedTask: ScheduleTask) => {
    if (!currentUser) {
      console.error('User must be authenticated to update schedule tasks');
      return;
    }
    try {
      const docRef = doc(db, 'scheduleTasks', updatedTask.id);
      await updateDoc(docRef, {
        ...updatedTask,
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error updating schedule task:', error);
      setScheduleTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
  }, [currentUser]);

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // Fazer logout do Firebase Auth
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
      case 'projects': return <ProjectsView projects={projects} onAddProject={handleAddProject} onSelectProject={handleSelectProject} userRole={userRole} />;
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
