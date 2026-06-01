import { describe, expect, it } from "vitest";
import { summarizeGuidanceForPrompt } from "../src/guidance.js";

describe("summarizeGuidanceForPrompt", () => {
  it("formats loaded guidance docs for the AI prompt", () => {
    const prompt = summarizeGuidanceForPrompt([
      {
        path: "CONTRIBUTING.md",
        content: "Please include tests."
      },
      {
        path: ".github/pull_request_template.md",
        content: "## Test plan"
      }
    ]);

    expect(prompt).toContain("# CONTRIBUTING.md");
    expect(prompt).toContain("Please include tests.");
    expect(prompt).toContain("# .github/pull_request_template.md");
  });

  it("uses a clear fallback when no guidance docs are loaded", () => {
    expect(summarizeGuidanceForPrompt([])).toBe("No repository guidance files were loaded.");
  });
});
