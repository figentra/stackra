/**
 * Stackra file contract:
 * Purpose: `RegistryReport`, what `checkRegistry` found: errors fail the gate, warnings and the report do not.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.3; ADR 0305 (one declaration per file).
 */

/** The outcome of the registry gate. */
export interface RegistryReport {
  /** Findings that fail the gate. */
  readonly errors: readonly string[];
  /** Findings that become fatal at a later milestone. */
  readonly warnings: readonly string[];
  /** Informational lines (Pro docs links still hidden, demos still missing). */
  readonly report: readonly string[];
}
