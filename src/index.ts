import * as core from "@actions/core";
import * as github from "@actions/github";
import { analyzeWithAi } from "./ai.js";
import { loadCodeOwnerHints } from "./codeowners.js";
import { composeReport, shouldFail, shouldPostComment } from "./comment.js";
import { loadConfig } from "./config.js";
import { validateConfig } from "./diagnostics.js";
import { loadRepositoryGuidance } from "./guidance.js";
import { getSkipReason } from "./ignore.js";
import { staleManagedLabels } from "./labels.js";
import { createReportPayload, writeReportJson } from "./report.js";
import { createReviewSummary } from "./review.js";
import { analyzeSubject } from "./rules.js";
import { applyLabels, buildSubject, getConfigRef, removeLabels, upsertComment } from "./github-client.js";

async function run(): Promise<void> {
  const token = core.getInput("github-token", { required: true });
  const openAiApiKey = core.getInput("openai-api-key") || process.env.OPENAI_API_KEY;
  const configPath = core.getInput("config-path") || ".maintainer-firewall.yml";
  const dryRun = parseBoolean(core.getInput("dry-run"));
  const failOnFindings = parseBoolean(core.getInput("fail-on-findings"));
  const writeStepSummary = parseBoolean(core.getInput("write-step-summary") || "true");
  const reportJsonPath = core.getInput("report-json-path");

  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

  const configRef = getConfigRef(github.context);
  const config = await loadConfig(octokit, owner, repo, configPath, configRef);
  for (const warning of validateConfig(config)) {
    core.warning(warning);
  }

  const subject = await buildSubject(octokit, github.context, config.issue.duplicateSearchLimit);

  if (!subject) {
    core.info(`Maintainer Firewall does not handle event ${github.context.eventName}.`);
    return;
  }

  const skipReason = getSkipReason(subject, config);
  if (skipReason) {
    core.setOutput("skipped", "true");
    core.setOutput("skip-reason", skipReason);
    const skippedReport = `## Maintainer Firewall report\n\nSkipped ${subject.kind} #${subject.number}: ${skipReason}.`;
    core.info(skippedReport);
    if (writeStepSummary) {
      await tryWrite("write step summary", async () => {
        await core.summary.addRaw(skippedReport, true).write();
      });
    }

    if (reportJsonPath) {
      await tryWrite("write JSON report", () =>
        writeReportJson(reportJsonPath, createReportPayload(subject, [], null, config, skipReason))
      );
      core.setOutput("report-json-path", reportJsonPath);
    }

    return;
  }

  const ruleFindings = analyzeSubject(subject, config);
  const hasPossibleSecret = ruleFindings.some((finding) => finding.id === "content.secret.possible");
  if (config.ai.enabled && !openAiApiKey) {
    core.warning("AI analysis is enabled in config, but no OpenAI API key was provided. Running deterministic checks only.");
  }

  if (hasPossibleSecret && config.ai.enabled && openAiApiKey) {
    core.warning("Skipping OpenAI analysis because a possible secret or credential was detected in the subject.");
  }

  const guidanceDocs = config.ai.enabled && openAiApiKey && !hasPossibleSecret
    ? await loadRepositoryGuidance(octokit, owner, repo, configRef, config)
    : [];
  const aiFindings = hasPossibleSecret
    ? []
    : await analyzeWithAi(subject, config, openAiApiKey, guidanceDocs);
  const findings = dedupeFindings([...ruleFindings, ...aiFindings]);
  const routingHints = subject.kind === "pull_request"
    ? await loadCodeOwnerHints(octokit, owner, repo, configRef, config, subject)
    : [];
  const summary = createReviewSummary(subject, findings, config, routingHints);
  const report = composeReport(subject, findings, config, summary);

  core.setOutput("skipped", "false");
  core.setOutput("outcome", summary.outcome);
  core.setOutput("score", String(summary.score));
  core.setOutput("findings-count", String(findings.length));
  core.setOutput("labels", summary.labels.join(","));
  core.setOutput("routing-hints", JSON.stringify(summary.routingHints));

  core.info(report);
  if (writeStepSummary) {
    await tryWrite("write step summary", async () => {
      await core.summary.addRaw(report, true).write();
    });
  }

  if (!dryRun) {
    if (summary.labels.length > 0) {
      await tryWrite("apply labels", () =>
        applyLabels(octokit, owner, repo, subject.number, summary.labels, config.labeling.createMissing)
      );
    }

    if (config.labeling.enabled && config.labeling.removeStale) {
      const staleLabels = staleManagedLabels(subject.labels, summary.labels, config);
      if (staleLabels.length > 0) {
        await tryWrite("remove stale labels", () => removeLabels(octokit, owner, repo, subject.number, staleLabels));
      }
    }

    if (shouldPostComment(config, findings)) {
      await tryWrite("upsert comment", () => upsertComment(
        octokit,
        owner,
        repo,
        subject.number,
        report,
        config.comment.updateExisting
      ));
    }
  } else {
    core.info("Dry run enabled. No labels or comments were written.");
  }

  if (reportJsonPath) {
    await tryWrite("write JSON report", () =>
      writeReportJson(reportJsonPath, createReportPayload(subject, findings, summary, config))
    );
    core.setOutput("report-json-path", reportJsonPath);
  }

  if (failOnFindings && shouldFail(findings)) {
    core.setFailed("Maintainer Firewall produced warning or error findings.");
  }
}

function dedupeFindings(findings: ReturnType<typeof analyzeSubject>): ReturnType<typeof analyzeSubject> {
  const seen = new Set<string>();
  const output = [];

  for (const finding of findings) {
    const key = `${finding.id}:${finding.title}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(finding);
  }

  return output;
}

function parseBoolean(value: string): boolean {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

async function tryWrite(operation: string, write: () => Promise<void>): Promise<void> {
  try {
    await write();
  } catch (error) {
    core.warning(`Could not ${operation}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
