
import { Project, Transaction, Vehicle, Employee, FuelLog, TimesheetRecord, CorporateCardTransaction } from './types';

export const CONSTRUCTION_STAGES = [
  {
    category: 'Preparação e Planeamento',
    tasks: [
      'Análise do projeto (arquitetura e especialidades)',
      'Compatibilização de projetos',
      'Obtenção de licenças e alvarás',
      'Planeamento da obra (cronograma)',
      'Orçamentação detalhada',
      'Contratação de subempreiteiros',
      'Plano de Segurança e Saúde (PSS)',
      'Plano de Gestão de Resíduos (RCD)',
      'Levantamento topográfico',
      'Marcação da implantação'
    ]
  },
  {
    category: 'Montagem do Estaleiro',
    tasks: [
      'Vedação do terreno',
      'Portão de acesso',
      'Placa de obra obrigatória',
      'Instalação de contentores',
      'Instalação sanitária provisória',
      'Ligação provisória de água',
      'Ligação provisória de eletricidade',
      'Zona de armazenamento de materiais',
      'Zona de resíduos',
      'Acessos provisórios e circulação interna',
      'Sinalização de segurança'
    ]
  },
  {
    category: 'Movimentos de Terra',
    tasks: [
      'Limpeza do terreno',
      'Decapagem da terra vegetal',
      'Escavações para fundações',
      'Escavações para redes enterradas',
      'Regularização do fundo de caixa',
      'Aterros e compactações',
      'Drenagens periféricas'
    ]
  },
  {
    category: 'Fundações e Estrutura',
    tasks: [
      'Betão de limpeza',
      'Cofragem das fundações',
      'Colocação de armaduras',
      'Betonagem das fundações',
      'Impermeabilização de fundações',
      'Muros de fundação ou cave',
      'Pilares',
      'Vigas',
      'Lajes',
      'Escadas estruturais',
      'Descofragem',
      'Cura do betão'
    ]
  },
  {
    category: 'Entrega da Obra',
    tasks: [
      'Limpeza grossa da obra',
      'Limpeza fina',
      'Remoção do estaleiro',
      'Revisão final',
      'Vistoria com o cliente',
      'Correção de anomalias',
      'Entrega das chaves',
      'Início do período de garantia'
    ]
  }
];

export const ALL_DEFAULT_TASKS = CONSTRUCTION_STAGES.flatMap(s => s.tasks);

// O sistema agora inicia sem dados para que o cliente possa cadastrar sua própria operação.
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_TRANSACTIONS: Transaction[] = [];
export const MOCK_VEHICLES: Vehicle[] = [];
export const MOCK_EMPLOYEES: Employee[] = [];
export const MOCK_FUEL_LOGS: FuelLog[] = [];
export const MOCK_TIMESHEET_RECORDS: TimesheetRecord[] = [];
export const MOCK_CARD_TRANSACTIONS: CorporateCardTransaction[] = [];
