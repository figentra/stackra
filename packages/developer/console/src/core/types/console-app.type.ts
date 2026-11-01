/**
 * Stackra file contract:
 * Purpose: `ConsoleApp`, what `createConsole` returns: a console that runs one argument vector against given ports
 *          and resolves with the exit code.
 * Boundary: a type only; the caller sets `process.exitCode`.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012.
 */
import type { ConsolePorts } from "#core/types/console-ports.type";

/** A ready console. */
export interface ConsoleApp {
  /** Runs `argv` (without the node and script paths) and resolves with the exit code. */
  readonly run: (argv: readonly string[], ports: ConsolePorts) => Promise<number>;
}
