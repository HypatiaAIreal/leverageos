export type FulcrumStatus = 'verified' | 'assumed' | 'at_risk' | 'absent';

export interface FulcrumState {
  status: FulcrumStatus;
  evidence: string;
  lastVerified: string | null;
  verificationEvent: string;
}

export interface LeverProperties {
  r: number; // Rigidity 1-10
  l: number; // Length 1-10
  q: number; // Quality 1-10
}

export interface Lever {
  id: string;
  name: string;
  description: string;
  category: string;
  created: string;
  properties: LeverProperties;
  effectiveLeverage: number; // R x L x Q
  fulcrums: {
    material: FulcrumState;
    epistemic: FulcrumState;
    relational: FulcrumState;
  };
  dependencies: string[];
  history: HistoryEntry[];
}

export interface HistoryEntry {
  date: string;
  properties: LeverProperties;
  fulcrums: {
    material: FulcrumState;
    epistemic: FulcrumState;
    relational: FulcrumState;
  };
}

export interface WeeklyReview {
  date: string;
  quickWin: string;
  bottleneck: string;
  sequenceAlerts: string[];
  fulcrumTraps: string[];
  celebration: string;
}

export interface SavedReview {
  id: string;
  date: string;
  quickWin: string;
  bottleneck: string;
  sequenceAlerts: string[];
  fulcrumTraps: string[];
  celebration: string;
  // Fulcrum scores at time of review (for evolution tracking)
  materialScore?: number;
  epistemicScore?: number;
  relationalScore?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: LeverAction[];
}

export interface LeverAction {
  leverId: string;
  leverName: string;
  field: string;
  value: string | number;
  applied?: boolean;
  type?: 'update_lever' | 'create_task';
  // For create_task actions
  taskLever?: string;
  taskName?: string;
  taskDue?: string;
}

export type ProjectStatus = 'not_started' | 'in_progress' | 'done';

export interface Subtask {
  id: string;
  name: string;
  done: boolean;
  notes: string;
  dueDate: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  leverId: string;
  leverName: string;
  dueDate: string | null;
  status: ProjectStatus;
  subtasks: Subtask[];
  created: string;
}

export type ViewName = 'dashboard' | 'workshop' | 'fulcrum-map' | 'sequence' | 'evolution' | 'chat' | 'tasks';
