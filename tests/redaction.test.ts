import { describe, expect, it } from "vitest";
import { redactByPatterns } from "../src/redaction.js";

describe("redactByPatterns", () => {
  it("redacts configured secret-like patterns", () => {
    const text = "token sk-abc12345678901234567890 should not leave";

    expect(redactByPatterns(text, ["\\bsk-[A-Za-z0-9_-]{20,}\\b"])).toBe("token [redacted] should not leave");
  });

  it("ignores invalid patterns", () => {
    expect(redactByPatterns("hello", ["["])).toBe("hello");
  });
});
