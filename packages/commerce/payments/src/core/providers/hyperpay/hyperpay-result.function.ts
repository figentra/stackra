/**
 * Stackra file contract:
 * Purpose: `hyperpayResult`, the class of an OPPWA result code: `success` (including success sent for manual
 *          review), `pending`, or `failed`, by the code groups OPPWA documents.
 * Boundary: internal to the HyperPay driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6).
 */

/** Successful, or successful and sent for review. */
const SUCCESS =
  /^(000\.000\.|000\.100\.1|000\.[36]|000\.400\.[1][12]0|000\.400\.0[^3]|000\.400\.100)/;

/** Waiting for the customer or the acquirer. */
const PENDING = /^(000\.200|800\.400\.5|100\.400\.500)/;

/**
 * What a result code means.
 *
 * @example
 * hyperpayResult("000.100.110"); // "success"
 */
export function hyperpayResult(code: string): "success" | "pending" | "failed" {
  if (SUCCESS.test(code)) return "success";
  return PENDING.test(code) ? "pending" : "failed";
}
