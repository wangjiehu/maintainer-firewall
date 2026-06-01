import { composeReport } from "../lib/src/comment.js";
import { defaultConfig } from "../lib/src/config.js";
import { createReviewSummary } from "../lib/src/review.js";
import { analyzeSubject } from "../lib/src/rules.js";

const subjects = [
  {
    kind: "issue",
    number: 17,
    title: "Crash on startup",
    body: "It crashes immediately when I open the app.",
    author: "new-contributor",
    labels: [],
    htmlUrl: "https://github.com/example/repo/issues/17",
    duplicateCandidates: []
  },
  {
    kind: "pull_request",
    number: 22,
    title: "Refactor cache layer",
    body: "This refactors the cache layer and closes #21. It updates eviction behavior and keeps the public API unchanged.",
    author: "new-contributor",
    labels: [],
    htmlUrl: "https://github.com/example/repo/pull/22",
    draft: false,
    baseRef: "main",
    headRef: "cache-refactor",
    changedFiles: [
      {
        filename: "src/cache.ts",
        status: "modified",
        additions: 260,
        deletions: 90,
        changes: 350
      }
    ]
  }
];

for (const subject of subjects) {
  const findings = analyzeSubject(subject, defaultConfig);
  const summary = createReviewSummary(subject, findings, defaultConfig);
  const report = composeReport(subject, findings, defaultConfig, summary);

  console.log(`\n--- ${subject.kind} #${subject.number} ---\n`);
  console.log(report);
}
