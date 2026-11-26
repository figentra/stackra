/**
 * Stackra file contract:
 * Purpose: `ToolRunResult`, the structured result of one `stackra` command a tool ran: the command line, where it
 *          ran, its exit code and time, and the tail of its plain-text output.
 * Boundary: type only; the test, typecheck, lint, gen and check tools add what they parse from the output.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run gen, validate and verify and explain failures); STA-2873.
 */

/** One CLI run, as a tool returns it. */
export type ToolRunResult = {
  /** The command line, as a person would type it (`stackra test --tier=unit`). */
  readonly command: string;
  /** The folder it ran in, from the repository root (`.` for the root). */
  readonly cwd: string;
  /** Its exit code; 0 is success. */
  readonly exitCode: number;
  /** It exited 0. */
  readonly ok: boolean;
  /** How long it ran, in milliseconds. */
  readonly durationMs: number;
  /** Its output without colour codes; the tail, where failures are, when it was longer than the limit. */
  readonly output: string;
};
