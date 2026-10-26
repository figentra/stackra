/**
 * Stackra file contract:
 * Purpose: `LINT_PHASE`, phase 7 of `stackra check`: oxlint with the repository's config over the affected JS and TS files
 *          or the whole tree (`--fix` applies the autofix rules), one finding per diagnostic.
 * Boundary: starts oxlint with `-f json`; skipped when it is not installed. A warning is reported but never fails the run.
 * Runtime: node
 * Governing contract: ADR 0129 (house lint plugin and coding standard).
 */
import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** The files oxlint reads. */
const LINTED = /\.[cm]?[jt]sx?$/;

/** The fields of one oxlint JSON diagnostic the phase keeps. */
type Diagnostic = {
  readonly message: string;
  readonly code?: string;
  readonly severity?: string;
  readonly filename?: string;
  readonly labels?: readonly {
    readonly span?: { readonly line?: number; readonly column?: number };
  }[];
};

/** The `lint` phase. */
export const LINT_PHASE: CheckPhase = {
  name: "lint",
  tool: "oxlint",
  adr: "0129",
  async run({ root, fix, files }) {
    const targets = files?.filter((file) => LINTED.test(file));
    if (targets !== undefined && targets.length === 0) return { findings: [] };
    const output = await runCaptured(
      "oxlint",
      ["-f", "json", ...(fix ? ["--fix"] : []), ...(targets ?? ["."])],
      root,
    );
    if (output === undefined) return { findings: [], skipped: "not installed" };
    let diagnostics: readonly Diagnostic[];
    try {
      diagnostics =
        (JSON.parse(output.stdout) as { readonly diagnostics?: readonly Diagnostic[] })
          .diagnostics ?? [];
    } catch {
      return { findings: output.code === 0 ? [] : [exitFinding(LINT_PHASE, output)] };
    }
    const findings = diagnostics.map((diagnostic) => {
      const span = diagnostic.labels?.[0]?.span;
      return toolFinding(LINT_PHASE, {
        rule: diagnostic.code ?? "oxlint",
        path: diagnostic.filename ?? ".",
        line: span?.line ?? null,
        column: span?.column ?? null,
        message: diagnostic.message,
        severity: diagnostic.severity === "error" ? "error" : "warning",
      });
    });
    if (output.code !== 0 && !findings.some((finding) => finding.severity === "error"))
      return { findings: [...findings, exitFinding(LINT_PHASE, output)] };
    return { findings };
  },
};
