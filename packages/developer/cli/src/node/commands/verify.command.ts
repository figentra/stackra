/**
 * Stackra file contract:
 * Purpose: `VerifyCommand`, `stackra verify`: every check phase, tests included (`stackra check --with-tests`), with
 *          the check flags. A tool of the local developer MCP (ADR 0282 decision 5): its `--json` data, the findings
 *          and the phase rows, is the tool result.
 * Boundary: `checkCommand` and `runCheck` do the work; it may fix files only with `--fix`.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 5); ADR 0506; STA-1966.
 */
import { checkCommand } from "#node/functions/check-command.function";

/** Runs every check phase, tests included. */
export class VerifyCommand extends checkCommand(
  {
    name: "verify",
    description: "Run every check phase, tests included (`stackra check --with-tests`)",
    tool: { readOnly: false },
  },
  { withTests: true },
) {}
