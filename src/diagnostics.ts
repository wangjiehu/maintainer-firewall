import type { FirewallConfig } from "./types.js";

export function validateConfig(config: FirewallConfig): string[] {
  const warnings: string[] = [];

  if (config.version !== 1) {
    warnings.push(`Unsupported config version ${config.version}; version 1 is the only supported version.`);
  }

  warnings.push(...invalidRegexWarnings("security.reportPatterns", config.security.reportPatterns));
  warnings.push(...invalidRegexWarnings("security.secretPatterns", config.security.secretPatterns));
  warnings.push(...invalidRegexWarnings("ignore.titlePatterns", config.ignore.titlePatterns));

  const labelValues = Object.values(config.labels).filter(Boolean);
  const duplicateLabels = labelValues.filter((label, index) => labelValues.indexOf(label) !== index);
  for (const label of [...new Set(duplicateLabels)]) {
    warnings.push(`Label "${label}" is configured for more than one finding type.`);
  }

  if (config.ai.enabled && !config.ai.model.trim()) {
    warnings.push("AI analysis is enabled, but ai.model is empty.");
  }

  if (config.comment.maxFindings < 1) {
    warnings.push("comment.maxFindings should be at least 1.");
  }

  return warnings;
}

function invalidRegexWarnings(path: string, patterns: string[]): string[] {
  return patterns
    .map((pattern) => {
      try {
        new RegExp(pattern);
        return null;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `${path} contains an invalid regular expression "${pattern}": ${message}`;
      }
    })
    .filter((warning): warning is string => Boolean(warning));
}
