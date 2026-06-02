import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("project documentation", () => {
  it("does not list shipped report surfaces as near-term roadmap work", () => {
    const roadmap = readFileSync("ROADMAP.md", "utf8");
    const nearTerm = sectionBetween(roadmap, "## Near Term", "## Later");

    expect(nearTerm).not.toContain("CODEOWNERS-aware routing hints");
    expect(nearTerm).not.toContain("step-summary output");
  });

  it("documents runtime resilience in the architecture guide", () => {
    const architecture = readFileSync("docs/ARCHITECTURE.md", "utf8");

    expect(architecture).toContain("degrade to warnings");
    expect(architecture).toContain("shared redaction helpers");
  });
});

function sectionBetween(markdown: string, start: string, end: string): string {
  const startIndex = markdown.indexOf(start);
  const endIndex = markdown.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return markdown.slice(startIndex, endIndex);
}
