/**
 * Stackra file contract:
 * Purpose: `exitFinding(phase, output)`, the one finding a phase reports when its tool failed but printed nothing the phase
 *          could parse: the exit code and the tool's last line, so a failure is never silent.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import type { Finding } from "@stackra/repo-checks/node";

import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";
import type { ToolOutput } from "#node/types/tool-output.type";

/**
 * The finding for a tool that exited `output.code` without a parsable finding.
 *
 * @param phase - the phase whose tool failed.
 * @param output - what the tool left behind.
 * @example
 * exitFinding(LINT_PHASE, { code: 2, stdout: "", stderr: "config not found\n" });
 */
export function exitFinding(
  phase: Pick<CheckPhase, "name" | "tool" | "adr">,
  output: ToolOutput,
): Finding {
  const last = `${output.stdout}\n${output.stderr}`
    .split("\n")
    .map((line) => line.trim())
    // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
    .filter(Boolean)
    .at(-1);
  return toolFinding(phase, {
    rule: "exit",
    message: `${phase.tool} exited ${output.code}${last === undefined ? "" : `: ${last}`}`,
  });
}
