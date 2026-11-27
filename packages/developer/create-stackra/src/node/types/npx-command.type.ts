/**
 * Stackra file contract:
 * Purpose: `NpxCommand`, how `npxCommand` says to start npx: a command and the arguments that come before npx's own.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */

/** A command and the arguments that come before npx's own. */
export type NpxCommand = {
  /** The program to start: this Node binary, or `npx` from the PATH. */
  readonly command: string;

  /** What comes before npx's own arguments: the `npx-cli.js` path, or nothing. */
  readonly args: readonly string[];
};
