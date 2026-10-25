/**
 * Stackra file contract:
 * Purpose: `SandboxResult`, what a run that finished gives back: its JSON output, the lines it logged and how long it
 *          ran, which the caller meters as `automation.code_ms`.
 * Boundary: a type only, plain data. A refused run carries `codeMs` in its refusal's details, so every run is metered.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decisions 7 and 8).
 */
import type { Json } from "@stackra/contracts";

/**
 * A finished run.
 *
 * @example
 * const { output, codeMs } = await sandbox.run(request);
 */
export interface SandboxResult {
  /** The returned value as JSON; `null` when the code returned nothing. */
  readonly output: Json;

  /** Each `console.log` line, in order. */
  readonly logs: readonly string[];

  /** The run's wall time in whole milliseconds. */
  readonly codeMs: number;
}
