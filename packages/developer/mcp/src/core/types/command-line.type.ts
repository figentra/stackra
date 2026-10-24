/**
 * Stackra file contract:
 * Purpose: `CommandLine`, a program and its arguments, ready for `spawn` without a shell.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 3: `stackra mcp exec`).
 */

/** A program and its arguments. */
export type CommandLine = {
  /** The program to start. */
  readonly command: string;
  /** Its arguments, passed as they are. */
  readonly args: readonly string[];
};
