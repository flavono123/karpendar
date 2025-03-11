import yaml from 'js-yaml';
import { NodePool } from '../types/karpenter';

export function parseYaml(yamlContent: string): NodePool | null {
  try {
    const parsed = yaml.load(yamlContent) as NodePool;

    // Basic validation
    if (
      !parsed ||
      parsed.kind !== 'NodePool' ||
      !parsed.apiVersion?.includes('karpenter.sh') ||
      !parsed.spec?.disruption?.budgets
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing YAML:', error);
    return null;
  }
}
