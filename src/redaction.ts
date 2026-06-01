export function redactByPatterns(value: string, patterns: string[], replacement = "[redacted]"): string {
  return patterns.reduce((output, pattern) => {
    try {
      return output.replace(new RegExp(pattern, "gi"), replacement);
    } catch {
      return output;
    }
  }, value);
}
