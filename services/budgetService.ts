
import { BudgetTask, TaskStatus } from '../types';

/**
 * Distribui automaticamente os 100% de peso entre as tarefas selecionadas.
 */
export const distributeWeights = (taskNames: string[]): BudgetTask[] => {
  if (taskNames.length === 0) return [];
  
  const individualWeight = 100 / taskNames.length;
  
  return taskNames.map(nome => ({
    id: Math.random().toString(36).substr(2, 9),
    nome,
    percentualTotal: Number(individualWeight.toFixed(2)),
    percentualConcluido: 0,
    status: 'Planeamento'
  }));
};

/**
 * Calcula o progresso total da obra baseado nos pesos e conclusão de cada tarefa.
 */
export const calculateTotalProgress = (tasks: BudgetTask[]): number => {
  if (tasks.length === 0) return 0;
  
  const total = tasks.reduce((acc, task) => {
    // Ex: Se a tarefa pesa 20% e está 50% concluída, ela contribui com 10% para o total da obra
    const contribution = (task.percentualConcluido * task.percentualTotal) / 100;
    return acc + contribution;
  }, 0);
  
  return Math.min(100, Math.round(total));
};

/**
 * Simulação de funções Firestore para atualização de subcoleções.
 * Na implementação real, utilize: collection(db, 'obras', obraId, 'tarefas')
 */
export const firestoreBudgetService = {
  updateTask: async (obraId: string, task: BudgetTask) => {
    console.log(`Firestore: Atualizando tarefa ${task.id} na obra ${obraId}`, task);
    // await updateDoc(doc(db, 'obras', obraId, 'tarefas', task.id), { ...task });
  },
  
  addTasksBatch: async (obraId: string, tasks: BudgetTask[]) => {
    console.log(`Firestore: Adicionando lote de tarefas na obra ${obraId}`, tasks);
    // Lógica de writeBatch aqui
  }
};
