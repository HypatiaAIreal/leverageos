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

export type ViewName = 'dashboard' | 'workshop' | 'fulcrum-map' | 'sequence' | 'evolution';
