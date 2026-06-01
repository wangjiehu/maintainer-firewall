import { describe, expect, it } from "vitest";
import { ownersForPath, parseCodeOwners } from "../src/codeowners.js";

describe("CODEOWNERS helpers", () => {
  it("parses owner rules and uses last match wins", () => {
    const rules = parseCodeOwners(`
# comment
*.ts @org/typescript
src/security/** @org/security
src/security/keys.ts @org/key-owners @alice
`);

    expect(ownersForPath("src/index.ts", rules)).toEqual(["@org/typescript"]);
    expect(ownersForPath("src/security/audit.ts", rules)).toEqual(["@org/security"]);
    expect(ownersForPath("src/security/keys.ts", rules)).toEqual(["@org/key-owners", "@alice"]);
  });

  it("supports root-anchored directory patterns", () => {
    const rules = parseCodeOwners(`
/docs/ @docs
`);

    expect(ownersForPath("docs/README.md", rules)).toEqual(["@docs"]);
    expect(ownersForPath("src/docs/README.md", rules)).toEqual([]);
  });

  it("matches basename patterns at the repository root and nested paths", () => {
    const rules = parseCodeOwners(`
*.md @docs
`);

    expect(ownersForPath("README.md", rules)).toEqual(["@docs"]);
    expect(ownersForPath("docs/README.md", rules)).toEqual(["@docs"]);
  });

  it("ignores malformed lines", () => {
    const rules = parseCodeOwners(`
docs/**
README.md user-without-at
*.md @docs
`);

    expect(rules).toHaveLength(1);
    expect(ownersForPath("README.md", rules)).toEqual(["@docs"]);
  });
});
