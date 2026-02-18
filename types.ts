
export enum ProjectStatus {
  PLANNED = 'Planejada',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluída',
  DELAYED = 'Atrasada'
}

export type UserRole = 'admin' | 'guest' | null;

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'Planta' | 'Câmara' | 'Projeto' | 'Outros';
  uploadDate: string;
  status: 'Válido' | 'Inválido';
  url?: string;
  fileName: string;
}

export interface ProjectStage {
  id: string;
  name: string;
  progress: number;
  status: 'Pendente' | 'Em Execução' | 'Concluído';
  weight: number; // Peso da etapa na obra total (default 1)
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
  progress: number; // 0-100
  stages?: ProjectStage[];
  documents?: ProjectDocument[];
  category: 'Industrial' | 'Comercial' | 'Residencial' | 'Metalomecânica' | 'Civil';
  priority: 'Baixa' | 'Normal' | 'Urgente';
  areaM2?: number;
  description?: string;
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
  progress: number; // 0-100%
  subTasks?: SubTask[]; // Detalhamento de mão de obra
}

export interface Material {
  id: string;
  projectId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  supplier: string;
  date: string;
}

export interface MaterialLog {
  id: string;
  projectId: string;
  date: string;
  materialName: string;
  quantity: number;
  unit: string; // kg, m2, un, sc
  unitPrice: number;
  supplier: string;
  invoice: string; // NF
  type: 'entrada' | 'saida';
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface LaborLog {
  id: string;
  projectId: string;
  workerName: string;
  role: string;
  workerType: 'CLT' | 'PJ' | 'Terceiro';
  date: string;
  hoursWorked: number;
  hourlyRate: number;
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
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

export interface VehicleDocument {
  id: string;
  name: string;
  type: 'Seguro' | 'IPO' | 'IUC' | 'Documento Único' | 'Outros';
  expiryDate?: string;
  uploadDate: string;
  url?: string; // URL para visualização do documento
  fileName?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string; // Ex: Troca de óleo, Pneus, Revisão
  cost: number;
  description: string;
  receiptUrl?: string;
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
  annualInspectionDate?: string; // Nova data de inspeção
  documents?: VehicleDocument[]; // Lista de documentos
  maintenanceHistory?: MaintenanceRecord[]; // Histórico de manutenções
  status: 'Operacional' | 'Manutenção';
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  kmStart: number;
  kmEnd: number;
  liters: number;
  cost: number;
  projectLinked: string;
  receiptUrl?: string;
  receiptFileName?: string;
}

export interface Employee {
  id: string;
  name: string;
  nif?: string; 
  role: string; 
  type: 'CLT' | 'PJ' | 'Terceiro';
  category: 'Administrative' | 'Operational'; 
  allocationId: string; // Pode ser ID de Obra ou ID de Departamento
  allocationType: 'project' | 'department'; // Tipo da alocação
  baseRate?: number; 
  hasCorporateCard?: boolean;
  cardLimit?: number;
  cardLast4?: string;
  cardExpiry?: string; 
  cardImage?: string; 
}

export interface CorporateCardTransaction {
  id: string;
  employeeId: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  receiptAttached: boolean;
  receiptFileName?: string; 
  receiptUrl?: string; 
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

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  critical: boolean;
  deadline: string;
}

export type ViewState = 'home' | 'dashboard' | 'projects' | 'schedule' | 'finance' | 'fleet' | 'compliance' | 'ai-analysis' | 'team' | 'project-detail' | 'timesheet' | 'corporate-cards';
