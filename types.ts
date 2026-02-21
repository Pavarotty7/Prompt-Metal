
export enum ProjectStatus {
  PLANNED = 'Planejada',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluída',
  DELAYED = 'Atrasada',
  WAITING_DOCUMENT = 'Aguardando Documento'
}

export type UserRole = 'admin' | 'guest' | null;

export type TaskStatus = 'Planeamento' | 'Preparação' | 'Em Execução' | 'Finalizada';

export interface BudgetTask {
  id: string;
  nome: string;
  percentualTotal: number; // Peso da tarefa na obra (ex: 20%)
  percentualConcluido: number; // Progresso dentro da tarefa (0-100)
  status: TaskStatus;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'Planta' | 'Câmara' | 'Projeto' | 'Outros';
  uploadDate: string;
  status: 'Válido' | 'Inválido';
  url?: string;
  fileName: string;
}

export interface MaterialLog {
  id: string;
  projectId: string;
  date: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  supplier: string;
  invoice: string;
  type: 'entrada' | 'saida';
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  responsible: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  budget: number;
  spent: number;
  progress: number;
  tarefas?: BudgetTask[]; // Lista de tarefas da planilha orçamentária
  documents?: ProjectDocument[];
  materialLogs?: MaterialLog[];
  category: 'Industrial' | 'Comercial' | 'Residencial' | 'Metalomecânica' | 'Civil';
  priority: 'Baixa' | 'Normal' | 'Urgente';
  areaM2?: number;
  description?: string;
  dataCriacao?: string;
  ownerId?: string;
}

export interface SubTask {
  id: string;
  title: string;
  responsible: string;
  progress: number;
}

export interface ScheduleTask {
  id: string;
  projectId?: string;
  title: string;
  responsible: string;
  startDate: string;
  endDate: string;
  status: 'Pendente' | 'Em Execução' | 'Concluído' | 'Atrasado';
  priority: 'Alta' | 'Média' | 'Baixa';
  progress: number;
  subTasks?: SubTask[];
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: 'Receita' | 'Material' | 'Mão de Obra' | 'Combustível' | 'Despesa Fixa' | 'Outros';
  amount: number;
  type: 'income' | 'expense';
  status: 'Pago' | 'Pendente';
  projectId?: string;
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface CorporateCardTransaction {
  id: string;
  employeeId: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  receiptAttached: boolean;
  receiptFileName?: string;
  receiptUrl?: string;
}

export interface VehicleDocument {
  id: string;
  name: string;
  type: 'Seguro' | 'IPO' | 'IUC' | 'Documento Único' | 'Outros';
  expiryDate?: string;
  uploadDate: string;
  url?: string;
  fileName?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  cost: number;
  description: string;
  receiptUrl?: string;
}

export interface FuelLog {
  id: string;
  date: string;
  km: number;
  liters: number;
  cost: number;
  receiptUrl?: string;
  receiptFileName?: string;
  vehicleId?: string;
}

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  year: number;
  currentKms: number;
  driver: string;
  lastMaintenance: string;
  nextMaintenance: string;
  annualInspectionDate?: string;
  documents?: VehicleDocument[];
  maintenanceHistory?: MaintenanceRecord[];
  fuelHistory?: FuelLog[];
  status: 'Operacional' | 'Manutenção';
}

export interface Employee {
  id: string;
  name: string;
  nif?: string; 
  role: string; 
  type: 'CLT' | 'PJ' | 'Terceiro';
  category: 'Administrative' | 'Operational'; 
  allocationId: string;
  allocationType: 'project' | 'department';
  baseRate?: number; 
  hasCorporateCard?: boolean;
  cardLimit?: number;
  cardLast4?: string;
  cardExpiry?: string; 
  cardImage?: string; 
}

export interface TimesheetRecord {
  id: string;
  employeeName: string;
  date: string;
  projectId: string;
  status: 'Presente' | 'Falta' | 'Folga' | 'Escritório';
  standardHours: number; 
  dailyRate: number; 
  hourlyRate: number; 
  overtimeHours: number;
  advanceDeduction: number; 
  notes?: string;
  totalPay: number; 
  attachment?: string; 
}

export interface DailyNote {
  id: string;
  date: string;
  content: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  completed: boolean;
}

export type ViewState = 'home' | 'dashboard' | 'projects' | 'schedule' | 'finance' | 'fleet' | 'ai-analysis' | 'team' | 'project-detail' | 'timesheet' | 'corporate-cards' | 'notes' | 'settings';
