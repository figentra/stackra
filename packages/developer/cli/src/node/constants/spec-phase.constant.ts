/**
 * Stackra file contract:
 * Purpose: `SPEC_PHASE`, phase 11 of `stackra check`: the repository's spec gates (`tools/scripts/spec-gate.mjs ci` and
 *          `spec-trace.mjs ci`, with `--base` when given), one finding per line they print. A repository without them
 *          reports "skipped (not installed)".
 * Boundary: runs the repository's own scripts: the spec workflow is Figentra-internal (it reads Linear branch names), so
 *           it stays in the repository and never moves into the CLI (ADR 0282 decision 4).
 * Runtime: node
 * Governing contract: ADR 0198 (spec states and traceability); ADR 0282 (decision 4).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Finding } from "@stackra/repo-checks/node";

import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** The spec gates and where each lives in a repository. */
const GATES = [
  ["spec-gate", "tools/scripts/spec-gate.mjs"],
  ["spec-trace", "tools/scripts/spec-trace.mjs"],
] as const;

/** The `spec` phase. */
export const SPEC_PHASE: CheckPhase = {
  name: "spec",
  tool: "spec",
  adr: "0198",
  async run({ root, base }) {
    const present = GATES.filter(([, script]) => existsSync(join(root, script)));
    if (present.length === 0) return { findings: [], skipped: "not installed" };
    const findings: Finding[] = [];
    for (const [rule, script] of present) {
      const output = await runCaptured(
        process.execPath,
        [script, "ci", ...(base === undefined ? [] : [`--base=${base}`])],
        root,
      );
      if (output === undefined || output.code === 0) continue;
      const lines = output.stderr
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith(`${rule}:`));
      if (lines.length === 0) findings.push(exitFinding({ ...SPEC_PHASE, tool: rule }, output));
      for (const line of lines)
        findings.push(
          toolFinding(SPEC_PHASE, { rule, message: line.slice(rule.length + 1).trim() }),
        );
    }
    return { findings };
  },
};
