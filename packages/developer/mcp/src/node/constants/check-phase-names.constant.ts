/**
 * Stackra file contract:
 * Purpose: `CHECK_PHASE_NAMES`, the phases the `check` tool can pick or skip: exactly the phases of `stackra check`,
 *          in run order, so the tool's enum never names a phase the CLI does not run.
 * Boundary: data only. `@stackra/cli`'s test of `MCP_COMMAND` fails when this list and `CHECK_PHASES` differ.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the CLI runs every check); STA-2873.
 */

/** Every `stackra check` phase name, in run order. */
export const CHECK_PHASE_NAMES = [
  "config",
  "format",
  "spelling",
  "secrets",
  "structure",
  "docs",
  "lint",
  "hooks",
  "gen",
  "typecheck",
  "catalogues",
  "spec",
  "test",
] as const;
