import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { labelsForFindings, staleManagedLabels } from "../src/labels.js";
import type { Finding } from "../src/types.js";

const finding: Finding = {
  id: "pr.tests.missing",
  severity: "warning",
  title: "Code changed without test changes",
  details: "No tests changed.",
  label: "needsTests",
  source: "rule"
};

describe("labels", () => {
  it("maps findings to configured labels", () => {
    expect(labelsForFindings([finding], defaultConfig)).toEqual(["needs-tests"]);
  });

  it("returns no labels when labeling is disabled", () => {
    expect(labelsForFindings([finding], {
      ...defaultConfig,
      labeling: {
        ...defaultConfig.labeling,
        enabled: false
      }
    })).toEqual([]);
  });

  it("computes stale managed labels", () => {
    expect(staleManagedLabels(["needs-info", "needs-tests", "external"], ["needs-tests"], defaultConfig)).toEqual(["needs-info"]);
  });

  it("does not compute stale labels when cleanup is disabled", () => {
    expect(staleManagedLabels(["needs-info"], [], {
      ...defaultConfig,
      labeling: {
        ...defaultConfig.labeling,
        removeStale: false
      }
    })).toEqual([]);
  });
});
