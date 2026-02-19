
import { Project, Transaction, Employee, Vehicle, TimesheetRecord, ChecklistItem } from "../types";

const STORAGE_KEYS = {
  PROJECTS: 'pm_projects',
  TRANSACTIONS: 'pm_transactions',
  EMPLOYEES: 'pm_employees',
  VEHICLES: 'pm_vehicles',
  TIMESHEETS: 'pm_timesheets',
  COMPLIANCE: 'pm_compliance'
};

const getLocal = <T>(key: string, defaultValue: T[] = []): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocal = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const databaseService = {
  // Backup e Restauração
  exportDatabase: () => {
    const backup: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      backup[key] = getLocal(storageKey);
    });
    return JSON.stringify(backup, null, 2);
  },

  importDatabase: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        if (data[key]) {
          setLocal(storageKey, data[key]);
        }
      });
      return true;
    } catch (e) {
      console.error("Erro ao importar backup:", e);
      return false;
    }
  },

  // Projetos
  getProjects: () => getLocal<Project>(STORAGE_KEYS.PROJECTS),
  saveProject: (project: Project) => {
    const projects = getLocal<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) projects[index] = project;
    else projects.unshift(project);
    setLocal(STORAGE_KEYS.PROJECTS, projects);
  },
  deleteProject: (id: string) => {
    const items = getLocal<Project>(STORAGE_KEYS.PROJECTS).filter(i => i.id !== id);
    setLocal(STORAGE_KEYS.PROJECTS, items);
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
  deleteVehicle: (id: string) => {
    const items = getLocal<Vehicle>(STORAGE_KEYS.VEHICLES).filter(i => i.id !== id);
    setLocal(STORAGE_KEYS.VEHICLES, items);
  },

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

  // Compliance
  getCompliance: () => getLocal<ChecklistItem>(STORAGE_KEYS.COMPLIANCE),
  saveCompliance: (items: ChecklistItem[]) => setLocal(STORAGE_KEYS.COMPLIANCE, items)
};
