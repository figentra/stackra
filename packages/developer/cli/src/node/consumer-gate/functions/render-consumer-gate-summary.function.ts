/**
 * Stackra file contract:
 * Purpose: `renderConsumerGateSummary(summary)`, the markdown of a run: a heading with the verdict, the core and
 *          product commits, one table row per step and one line per allow-list problem.
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
  const lines = [
    `# Consumer gate: ${summary.product} (${summary.verdict})`,
    "",
    `Core \`${summary.core.sha ?? "unknown"}\`, product \`${summary.checkout.sha ?? "unknown"}\` (pinned \`${summary.ref}\`), ${summary.date}.`,
    "",
    "| Step | Result | Detail |",
    "| --- | --- | --- |",
    ...summary.steps.map(
      (step) =>
        `| ${step.id} | ${CONSUMER_GATE_LABELS[step.status]} | ${describeConsumerGateStep(step).replaceAll("|", "\\|")} |`,
    ),
    ...summary.problems.flatMap((problem) => ["", `Allow-list problem: ${problem}`]),
  ];
  return `${lines.join("\n")}\n`;
}
