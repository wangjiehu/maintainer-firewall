import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { createReportPayload } from "../src/report.js";
import type { IssueSubject } from "../src/types.js";

describe("createReportPayload", () => {
  it("omits body content and redacts configured secrets from titles", () => {
    const subject: IssueSubject = {
      kind: "issue",
      number: 1,
      title: "Leaked sk-123456789012345678901234567890",
      body: "secret body should not be serialized",
      author: "reporter",
      labels: [],
      htmlUrl: "https://github.com/example/repo/issues/1",
      duplicateCandidates: []
    };

    const payload = createReportPayload(subject, [], null, defaultConfig);

    expect(JSON.stringify(payload)).not.toContain("secret body");
    expect(payload.subject?.title).toBe("Leaked [redacted]");
  });
});
