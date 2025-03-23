import yaml from 'js-yaml';
import {
  NodePool,
  NormalizedDisruptionReason,
  UnnormalizedNodePool,
} from '../types/karpenter';

export function parseYaml(yamlContent: string): NodePool | null {
  try {
    const parsed = yaml.load(yamlContent) as UnnormalizedNodePool;

    // Basic validation
    if (
      !parsed ||
      parsed.kind !== 'NodePool' ||
      !parsed.apiVersion?.includes('karpenter.sh') ||
      !parsed.spec?.disruption?.budgets
    ) {
      return null;
    }

    // mutation
    parsed.spec.disruption.budgets = parsed.spec.disruption.budgets.map(
      budget => {
        if (budget.reasons) {
          return {
            ...budget,
            reasons: budget.reasons.map(
              reason => reason.toLowerCase() as NormalizedDisruptionReason
            ),
          };
        }
        return budget;
      }
    );

    return parsed;
  } catch (error) {
    console.error('Error parsing YAML:', error);
    return null;
  }
}
