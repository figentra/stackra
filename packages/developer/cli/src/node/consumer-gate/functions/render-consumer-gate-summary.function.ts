/**
 * Stackra file contract:
 * Purpose: `renderConsumerGateSummary(summary)`, the markdown of a run: a heading with the verdict, the core and
 *          product commits, one table row per step, one line per allow-list problem, the gen drift and the environment block.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { CONSUMER_GATE_LABELS } from "#node/consumer-gate/constants/consumer-gate-labels.constant";
import { describeConsumerGateStep } from "#node/consumer-gate/functions/describe-consumer-gate-step.function";
import type { ConsumerGateSummary } from "#node/consumer-gate/types/consumer-gate-summary.type";

/**
 * Renders the summary as markdown.
 *
 * @param summary - the run summary.
 * @example
 * renderConsumerGateSummary(summary).startsWith("# Consumer gate: billing"); // true
 */
export function renderConsumerGateSummary(summary: ConsumerGateSummary): string {
  const env = summary.environment;
  const lines = [
    `# Consumer gate: ${summary.product} (${summary.verdict})`,
    "",
    `Core \`${summary.core.sha ?? "unknown"}\`, product \`${summary.checkout.sha ?? "unknown"}\` (pinned \`${summary.ref}\`), ${summary.mode} mode, ${summary.date}.`,
    "",
    "| Step | Result | Detail |",
    "| --- | --- | --- |",
    ...summary.steps.map(
      (step) =>
        `| ${step.id} | ${CONSUMER_GATE_LABELS[step.status]} | ${describeConsumerGateStep(step).replaceAll("|", "\\|")} |`,
    ),
    ...summary.problems.flatMap((problem) => ["", `Allow-list problem: ${problem}`]),
    ...(summary.genDrift === undefined
      ? []
      : [
          "",
          `Gen drift: ${summary.genDrift.changes} uncommitted path(s) after gen, see \`${summary.genDrift.file}\`.`,
        ]),
    "",
    "Environment:",
    `- node ${env.node}, pnpm ${env.pnpm ?? "unknown"}, @stackra/gen ${env.gen ?? "unknown"}`,
    `- lockfile sha256: before \`${env.lockfileBefore ?? "none"}\`, after install \`${env.lockfileAfter ?? "none"}\``,
    ...Object.entries(env.overlays).map(
      ([service, hash]) => `- overlay ${service} sha256 \`${hash}\``,
    ),
    `- reproduce: \`${env.reproduce}\``,
  ];
  return `${lines.join("\n")}\n`;
}
