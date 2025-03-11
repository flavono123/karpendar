export type DisruptionReason = 'Empty' | 'Drifted' | 'Underutilized';

export interface DisruptionBudget {
  nodes: string; // Can be a percentage like "20%" or a number like "5"
  reasons?: DisruptionReason[];
  schedule?: string; // Cron expression or special macros like "@daily"
  duration?: string; // Duration string like "10m" or "24h"
}

export interface NodePoolDisruption {
  consolidationPolicy?: 'WhenEmpty' | 'WhenEmptyOrUnderutilized';
  budgets: DisruptionBudget[];
}

export interface NodePoolSpec {
  template?: {
    spec?: {
      expireAfter?: string;
    };
  };
  disruption: NodePoolDisruption;
}

export interface NodePool {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
  };
  spec: NodePoolSpec;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    reason: DisruptionReason | 'All';
    nodes: string;
    budget: DisruptionBudget;
  };
}
