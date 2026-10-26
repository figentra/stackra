/**
 * Stackra file contract:
 * Purpose: `toolFinding(phase, fields)`, a `Finding` of one check phase from the fields a tool's output gives, with the
 *          phase's tool and ADR filled in and the rest defaulted (no location, error, not fixable).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0129 (a finding names its ADR).
 */
import type { Finding } from "@stackra/repo-checks/node";

import type { CheckPhase } from "#node/types/check-phase.type";

/**
 * The finding `fields` describe, in `phase`.
 *
 * @param phase - the phase that found it (its name, tool and ADR).
 * @param fields - at least the rule and the message; `path` defaults to `.`.
 * @example
 * toolFinding(FORMAT_PHASE, { rule: "format", path: "a.ts", message: "not formatted", fixable: true });
 */
export function toolFinding(
  phase: Pick<CheckPhase, "name" | "tool" | "adr">,
  fields: {
    readonly rule: string;
    readonly message: string;
    readonly path?: string | undefined;
    readonly line?: number | null | undefined;
    readonly column?: number | null | undefined;
    readonly severity?: "error" | "warning" | undefined;
    readonly fixable?: boolean | undefined;
    readonly tool?: string | undefined;
  },
): Finding {
  return {
    phase: phase.name,
    tool: fields.tool ?? phase.tool,
    rule: fields.rule,
    path: fields.path ?? ".",
    line: fields.line ?? null,
    column: fields.column ?? null,
    message: fields.message,
    severity: fields.severity ?? "error",
    fixable: fields.fixable ?? false,
    adr: /\bADR (\d{4})\b/.exec(fields.message)?.[1] ?? phase.adr,
  };
}
