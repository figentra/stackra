/**
 * Stackra file contract:
 * Purpose: `LaunchConfiguration`, one dev server of Claude Code's `.claude/launch.json`.
 * Boundary: type only; the shape is Claude Code's (SchemaStore `claude-code-launch.json`).
 * Runtime: node
 * Governing contract: STA-2081.
 */

/** One server Claude can start. */
export type LaunchConfiguration = {
  /** The name Claude starts it by. */
  readonly name: string;

  /** The program run. */
  readonly runtimeExecutable: string;

  /** The arguments the program runs with. */
  readonly runtimeArgs: readonly string[];

  /** The port it listens on, which Claude opens. */
  readonly port: number;
};
