import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const yamlFiles = [
  ".github/dependabot.yml",
  ".github/workflows/codeql.yml",
  ".github/workflows/maintainer-firewall.yml",
  ".github/workflows/release.yml",
  ".github/workflows/test.yml",
  ".maintainer-firewall.yml",
  "examples/config.quiet.yml",
  "examples/config.strict.yml",
  "examples/dry-run-workflow.yml",
  "examples/workflow.yml"
];

describe("YAML files", () => {
  it.each(yamlFiles)("parses %s", (file) => {
    expect(() => parse(readFileSync(file, "utf8"))).not.toThrow();
  });
});
