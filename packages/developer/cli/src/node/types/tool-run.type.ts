/**
 * Stackra file contract:
 * Purpose: `ToolRun`, the one process a tool command starts: the program, its arguments and the directory it runs in.
 * Boundary: type only; `resolveTool` builds it and `runProcess` starts it without a shell.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: tools read the configs gen writes into `.stackra/`).
 */

/** One tool process. */
export type ToolRun = {
  /** The program, found on `PATH` or in a `node_modules/.bin` above `cwd`. */
  readonly command: string;

  /** Its arguments; never parsed by a shell. */
  readonly args: readonly string[];

  /** The absolute directory it runs in. */
  readonly cwd: string;
};
