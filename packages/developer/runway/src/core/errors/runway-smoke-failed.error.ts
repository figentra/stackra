/**
 * Stackra file contract:
 * Purpose: `RunwaySmokeFailedError`, thrown by the smoke step when a subject failed or had no driver, so the promotion
 *          that needs the step is blocked.
 * Boundary: a plain `Error` that carries every result, the passing ones too, and names the failed subjects.
 * Runtime: isomorphic
 * Governing contract: STA-265 spec (D5, D6, FR-009).
 */
import type { SmokeResult } from "#core/types/smoke-result.type";

/**
 * A smoke step with at least one failed subject.
 *
 * @example
 * await smokePreview(request); // throws "Smoke failed: web console, mobile shopper (ios)"
 */
export class RunwaySmokeFailedError extends Error {
  /** Every result, in check order. */
  readonly results: readonly SmokeResult[];

  /**
   * @param results - every result of the step.
   */
  constructor(results: readonly SmokeResult[]) {
    const failed = results.filter((result) => !result.passed);
    super(`Smoke failed: ${failed.map((result) => `${result.target} ${result.name}`).join(", ")}`);
    this.name = "RunwaySmokeFailedError";
    this.results = results;
  }
}
