/**
 * Stackra file contract:
 * Purpose: `BootstrapHost`, everything `runCreateStackra` reads from or does to the machine: the environment, the
 *          Node version and binary, the platform, a file-exists probe, the two output streams and starting a child
 *          process. `PROCESS_HOST` is the real one; tests pass a fake.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */
import type { BootstrapEnv } from "#node/types/bootstrap-env.type";

/** The machine `runCreateStackra` runs on. */
export type BootstrapHost = {
  /** The environment the child inherits (with `STACKRA_REGISTRY` set on top). */
  readonly env: BootstrapEnv;

  /** `process.versions.node`, for example `24.22.0`. */
  readonly nodeVersion: string;

  /** `process.execPath`: the Node binary, beside which npm's `npx-cli.js` is looked for. */
  readonly execPath: string;

  /** The operating system, as `process.platform` names it (`linux`, `darwin`, `win32`). */
  readonly platform: string;

  /** Whether a file exists. */
  readonly exists: (path: string) => boolean;

  /** Writes one line to standard output. */
  readonly out: (line: string) => void;

  /** Writes one line to standard error. */
  readonly err: (line: string) => void;

  /**
   * Starts `command` with `args` (no shell), its streams joined to this process's, and resolves with its exit code;
   * rejects when it cannot start (for example `ENOENT`).
   */
  readonly run: (command: string, args: readonly string[], env: BootstrapEnv) => Promise<number>;
};
