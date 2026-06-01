import type { Finding, FirewallConfig } from "./types.js";

export function labelsForFindings(findings: Finding[], config: FirewallConfig): string[] {
  if (!config.labeling.enabled) {
    return [];
  }

  return [
    ...new Set(
      findings
        .map((finding) => finding.label ? config.labels[finding.label] : undefined)
        .filter((label): label is string => Boolean(label))
    )
  ];
}

export function managedLabels(config: FirewallConfig): string[] {
  return [...new Set(Object.values(config.labels).filter(Boolean))];
}

export function staleManagedLabels(
  existingLabels: string[],
  desiredLabels: string[],
  config: FirewallConfig
): string[] {
  if (!config.labeling.enabled || !config.labeling.removeStale) {
    return [];
  }

  return managedLabels(config)
    .filter((label) => existingLabels.includes(label) && !desiredLabels.includes(label));
}
