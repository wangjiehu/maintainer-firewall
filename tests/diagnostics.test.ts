import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { validateConfig } from "../src/diagnostics.js";

describe("validateConfig", () => {
  it("warns about invalid regex patterns", () => {
    const warnings = validateConfig({
      ...defaultConfig,
      security: {
        ...defaultConfig.security,
        secretPatterns: ["["]
      }
    });

    expect(warnings.some((warning) => warning.includes("security.secretPatterns"))).toBe(true);
  });

  it("warns about duplicate configured labels", () => {
    const warnings = validateConfig({
      ...defaultConfig,
      labels: {
        ...defaultConfig.labels,
        needsTests: defaultConfig.labels.needsInfo
      }
    });

    expect(warnings.some((warning) => warning.includes(defaultConfig.labels.needsInfo))).toBe(true);
  });
});
