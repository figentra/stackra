/**
 * Stackra file contract:
 * Purpose: `CommandOutcome`, how a `stackra` command the local MCP ran ended: its exit code and its combined output.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run gen, validate and verify and explain failures).
 */

/** The end of one CLI command. */
export type CommandOutcome = {
  /** The exit code; 0 is success. */
  readonly exitCode: number;
  /** Standard output and standard error, interleaved as they arrived. */
  readonly output: string;
};
