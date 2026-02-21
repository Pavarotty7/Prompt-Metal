
import { Project, Transaction, Employee, Vehicle, TimesheetRecord, DailyNote } from "../types";

const STORAGE_KEYS = {
  PROJECTS: 'pm_projects',
  TRANSACTIONS: 'pm_transactions',
  EMPLOYEES: 'pm_employees',
  VEHICLES: 'pm_vehicles',
  TIMESHEETS: 'pm_timesheets',
  NOTES: 'pm_notes'
};

const getLocal = <T>(key: string, defaultValue: T[] = []): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocal = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const databaseService = {
  // Projetos
  getProjects: () => getLocal<Project>(STORAGE_KEYS.PROJECTS),
  saveProject: (project: Project) => {
    const projects = getLocal<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) projects[index] = project;
    else projects.unshift(project);
    setLocal(STORAGE_KEYS.PROJECTS, projects);
  },

  // Transações
  getTransactions: () => getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS),
  saveTransaction: (tx: Transaction) => {
    const items = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const index = items.findIndex(i => i.id === tx.id);
    if (index >= 0) items[index] = tx;
    else items.unshift(tx);
    setLocal(STORAGE_KEYS.TRANSACTIONS, items);
  },
  deleteTransaction: (id: string) => {
    const items = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS).filter(i => i.id !== id);
    setLocal(STORAGE_KEYS.TRANSACTIONS, items);
  },

  // Funcionários
  getEmployees: () => getLocal<Employee>(STORAGE_KEYS.EMPLOYEES),
  saveEmployee: (emp: Employee) => {
    const items = getLocal<Employee>(STORAGE_KEYS.EMPLOYEES);
    const index = items.findIndex(i => i.id === emp.id);
    if (index >= 0) items[index] = emp;
    else items.push(emp);
    setLocal(STORAGE_KEYS.EMPLOYEES, items);
  },

  // Veículos
  getVehicles: () => getLocal<Vehicle>(STORAGE_KEYS.VEHICLES),
  saveVehicles: (vehicles: Vehicle[]) => setLocal(STORAGE_KEYS.VEHICLES, vehicles),

  // Timesheet
  getTimesheets: () => getLocal<TimesheetRecord>(STORAGE_KEYS.TIMESHEETS),
  saveTimesheets: (newRecords: TimesheetRecord[]) => {
    const items = getLocal<TimesheetRecord>(STORAGE_KEYS.TIMESHEETS);
    const combined = [...newRecords, ...items];
    setLocal(STORAGE_KEYS.TIMESHEETS, combined);
  },
  deleteTimesheet: (id: string) => {
    const items = getLocal<TimesheetRecord>(STORAGE_KEYS.TIMESHEETS).filter(i => i.id !== id);
    setLocal(STORAGE_KEYS.TIMESHEETS, items);
  },

  // Notas
  getNotes: () => getLocal<DailyNote>(STORAGE_KEYS.NOTES),
  saveNote: (note: DailyNote) => {
    const items = getLocal<DailyNote>(STORAGE_KEYS.NOTES);
    const index = items.findIndex(i => i.id === note.id);
    if (index >= 0) items[index] = note;
    else items.unshift(note);
    setLocal(STORAGE_KEYS.NOTES, items);
  },
  deleteNote: (id: string) => {
    const items = getLocal<DailyNote>(STORAGE_KEYS.NOTES).filter(i => i.id !== id);
    setLocal(STORAGE_KEYS.NOTES, items);
  },

  // Backup & Import
  getAllData: () => {
    return {
      projects: getLocal<Project>(STORAGE_KEYS.PROJECTS),
      transactions: getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS),
      employees: getLocal<Employee>(STORAGE_KEYS.EMPLOYEES),
      vehicles: getLocal<Vehicle>(STORAGE_KEYS.VEHICLES),
      timesheets: getLocal<TimesheetRecord>(STORAGE_KEYS.TIMESHEETS),
      notes: getLocal<DailyNote>(STORAGE_KEYS.NOTES)
    };
  },
  importAllData: (data: any) => {
    if (data.projects) setLocal(STORAGE_KEYS.PROJECTS, data.projects);
    if (data.transactions) setLocal(STORAGE_KEYS.TRANSACTIONS, data.transactions);
    if (data.employees) setLocal(STORAGE_KEYS.EMPLOYEES, data.employees);
    if (data.vehicles) setLocal(STORAGE_KEYS.VEHICLES, data.vehicles);
    if (data.timesheets) setLocal(STORAGE_KEYS.TIMESHEETS, data.timesheets);
    if (data.notes) setLocal(STORAGE_KEYS.NOTES, data.notes);
  }
};
