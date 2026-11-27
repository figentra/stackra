/**
 * Stackra file contract:
 * Purpose: `exitCode(code, signal)`, the exit code of a finished child process: its own code, else 128 plus the number
 *          of the signal that ended it (as a shell reports it), else 1.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */
import { constants } from "node:os";

/**
 * The exit code of a child that ended with `code` or by `signal`.
 *
 * @param code - the child's exit code, null when a signal ended it.
 * @param signal - the signal that ended it, if any.
 * @example
 * exitCode(null, "SIGINT"); // 130
 */
export function exitCode(code: number | null, signal: NodeJS.Signals | null): number {
  if (code !== null) return code;
  return signal === null ? 1 : 128 + (constants.signals[signal] ?? 0);
}
