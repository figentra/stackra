/**
 * Stackra file contract:
 * Purpose: `DiagnosticReport`, the part every local MCP tool result starts with: whether the run passed and the
 *          findings it reported, each a `Diagnostic`. A tool adds its own data beside it.
 * Boundary: a type only. `ok` is the run's own verdict (exit code 0); `diagnostics` may hold warnings when it is true,
 *           and holds at least one error when it is false.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 5); STA-2886.
 */
import type { Diagnostic } from "#contracts/types/diagnostic.type";

/** A run's verdict and findings. */
export interface DiagnosticReport {
  /** The run passed. */
  readonly ok: boolean;

  /** Its findings, errors first. */
  readonly diagnostics: readonly Diagnostic[];
}
