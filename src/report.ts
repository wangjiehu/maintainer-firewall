import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Finding, FirewallConfig, ReviewSummary, Subject } from "./types.js";
import { redactByPatterns, redactFinding, redactReviewSummary } from "./redaction.js";

export interface ReportPayload {
  version: 1;
  skipped: boolean;
  skipReason?: string;
  subject?: {
    kind: Subject["kind"];
    number: number;
    title: string;
    author: string;
    url: string;
    labels: string[];
    changedFiles?: Array<{
      filename: string;
      status: string;
      additions: number;
      deletions: number;
    }>;
  };
  summary?: ReviewSummary;
  findings: Finding[];
}

export function createReportPayload(
  subject: Subject | null,
  findings: Finding[],
  summary: ReviewSummary | null,
  config: FirewallConfig,
  skipReason?: string
): ReportPayload {
  return {
    version: 1,
    skipped: Boolean(skipReason),
    skipReason,
    subject: subject ? sanitizeSubject(subject, config) : undefined,
    summary: summary ? redactReviewSummary(summary, config.security.secretPatterns) : undefined,
    findings: findings.map((finding) => redactFinding(finding, config.security.secretPatterns))
  };
}

export async function writeReportJson(path: string, payload: ReportPayload): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sanitizeSubject(subject: Subject, config: FirewallConfig): NonNullable<ReportPayload["subject"]> {
  const base = {
    kind: subject.kind,
    number: subject.number,
    title: redactByPatterns(subject.title, config.security.secretPatterns),
    author: subject.author,
    url: subject.htmlUrl,
    labels: subject.labels
  };

  if (subject.kind === "issue") {
    return base;
  }

  return {
    ...base,
    changedFiles: subject.changedFiles.map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions
    }))
  };
}
