/**
 * Stackra file contract:
 * Purpose: `runCheck(context, defaults)`, the run behind `stackra check` and its aliases: the selected phases in order
 *          at the workspace root, each over the affected files when `--affected`, stopping after the first phase that
 *          fails; then the findings (text lines grouped by phase, a JSON array, or GitHub annotations) and, except for
 *          JSON, the summary table. Resolves 1 when any phase failed, 0 otherwise.
 * Boundary: writes findings and the table to `io.out` and phase notices to `io.err`; a phase that throws becomes one
 *           `crash` finding, never an uncaught error. Reads `CI` from the environment.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the CLI runs every check); the quality-gate coverage audit of 2026-10-27
 *                     (proposed `stackra check`: order, flags, output).
 */
import type { Finding } from "@stackra/repo-checks/node";

import { CHECK_PHASES } from "#node/constants/check-phases.constant";
import { changedFiles } from "#node/functions/changed-files.function";
import { formatFinding } from "#node/functions/format-finding.function";
import { isAffected } from "#node/functions/is-affected.function";
import { parseCheckOptions } from "#node/functions/parse-check-options.function";
import { summaryTable } from "#node/functions/summary-table.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CheckRun } from "#node/types/check-run.type";
import type { CliContext } from "#node/types/cli-context.type";
import type { PhaseOutcome } from "#node/types/phase-outcome.type";

/**
 * Runs the checks `context` asks for and resolves with the exit code.
 *
 * @param context - the command's context (cwd, io, parsed flags).
 * @param defaults - what an alias presets (`only`, `fix`, `withTests`).
 * @throws CliUsageError when a flag value is unknown.
 * @example
 * await runCheck(context, { only: ["format", "lint"], fix: true }); // `stackra code:fix`
 */
export async function runCheck(
  context: CliContext,
  defaults: Parameters<typeof parseCheckOptions>[1],
): Promise<number> {
  const options = parseCheckOptions(context.values, defaults);
  const root = workspaceRoot(context.cwd);
  const files = options.affected ? changedFiles(root, options.base ?? "origin/main") : undefined;
  const run: CheckRun = {
    root,
    fix: options.fix,
    files,
    base: options.base,
    ci: Boolean(process.env["CI"]),
    io: context.io,
  };
  const rows: { phase: string; status: string; findings: number; fixable: number; ms: number }[] =
    [];
  const all: Finding[] = [];
  let failed = false;
  for (const phase of CHECK_PHASES.filter(({ name }) => options.phases.includes(name))) {
    if (failed) {
      rows.push({ phase: phase.name, status: "not run", findings: 0, fixable: 0, ms: 0 });
      continue;
    }
    const started = performance.now();
    let outcome: PhaseOutcome;
    try {
      outcome = await phase.run(run);
    } catch (error) {
      outcome = {
        findings: [
          toolFinding(phase, {
            rule: "crash",
            message: error instanceof Error ? error.message : String(error),
          }),
        ],
      };
    }
    const findings =
      files === undefined
        ? outcome.findings
        : outcome.findings.filter((f) => isAffected(f.path, files));
    const status =
      outcome.skipped !== undefined
        ? `skipped (${outcome.skipped})`
        : findings.some((f) => f.severity === "error")
          ? "failed"
          : "passed";
    failed = status === "failed";
    all.push(...findings);
    rows.push({
      phase: phase.name,
      status,
      findings: findings.length,
      fixable: findings.filter((f) => f.fixable).length,
      ms: performance.now() - started,
    });
  }

  const { io } = context;
  if (options.format === "json") {
    io.out(`${JSON.stringify(all, null, 2)}\n`);
    return failed ? 1 : 0;
  }
  if (options.format === "github") {
    for (const finding of all) io.out(`${formatFinding(finding, "github")}\n`);
  } else {
    for (const { phase } of rows) {
      const own = all.filter((finding) => finding.phase === phase);
      if (own.length === 0) continue;
      io.out(`\n${phase}\n`);
      for (const finding of own) io.out(`${formatFinding(finding, "text")}\n`);
    }
  }
  io.out(`\n${summaryTable(rows)}`);
  return failed ? 1 : 0;
}
