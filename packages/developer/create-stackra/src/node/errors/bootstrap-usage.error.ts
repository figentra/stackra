/**
 * Stackra file contract:
 * Purpose: `BootstrapUsageError`, a command line `create-stackra` cannot run: an option without its value, a
 *          `--cli` that is not a version or tag, a registry that is not an http(s) URL. Exit code 2.
 * Boundary: error type only; the message names the argument, never an environment value other than the registry.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */

/** A `create-stackra` command line that cannot run. */
export class BootstrapUsageError extends Error {
  /** The error name the binary prints and tests match. */
  override readonly name = "BootstrapUsageError";
}
