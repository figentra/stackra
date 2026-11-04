/**
 * Stackra file contract:
 * Purpose: `CheckCommand`, `stackra check [--fix] [--affected] [--only <phase,…>] [--skip <phase,…>]
 *          [--format text|json|github] [--base <ref>] [--with-tests] [--keep-going]`: the quality gate's phases in
 *          order (config, format, spelling, secrets, structure, docs, lint, gen, …), the findings by phase and the
 *          summary table; exits 1 when a phase failed. `--json` data: the findings and the phase rows.
 * Boundary: `checkCommand` and `runCheck` do the work.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506; STA-1966; the quality-gate coverage audit of 2026-10-27.
 */
import { checkCommand } from "#node/functions/check-command.function";

/** Runs the quality gate. */
export class CheckCommand extends checkCommand({
  name: "check",
  description:
    "Run the quality gate: config, format, spelling, secrets, structure, docs, lint, gen, …",
}) {}
