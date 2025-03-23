export type DisruptionReason =
  | 'Empty'
  | 'Drifted'
  | 'Underutilized'
  | 'drifted'
  | 'empty'
  | 'underutilized';
export type NormalizedDisruptionReason = 'empty' | 'drifted' | 'underutilized';

export interface DisruptionBudget {
  nodes: string; // Can be a percentage like "20%" or a number like "5"
  reasons?: NormalizedDisruptionReason[];
  schedule?: string; // Cron expression or special macros like "@daily"
  duration?: string; // Duration string like "10m" or "24h"
}

export interface NodePoolDisruption {
  budgets?: DisruptionBudget[];
}

export interface NodePoolSpec {
  disruption?: NodePoolDisruption;
}

export interface NodePool {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
  };
  spec: NodePoolSpec;
}

export interface AtTimeBudget {
  nodesOrPercentage: string;
  reason: NormalizedDisruptionReason;
}

interface UnnormalizedDisruptionBudget extends DisruptionBudget {
  reason?: DisruptionReason;
}

interface UnnormalizedNodePoolSpec extends NodePoolSpec {
  budgets?: UnnormalizedDisruptionBudget[];
}

export interface UnnormalizedNodePool extends NodePool {
  spec: UnnormalizedNodePoolSpec;
}
