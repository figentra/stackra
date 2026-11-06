/**
 * Stackra file contract:
 * Purpose: `DeliveryError`, what a cross-app delivery keeps of its last failure: a code and, for an answer, its HTTP
 *          status.
 * Boundary: a type only. Never a body: neither the envelope nor the consumer's answer is kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 12); ADR 0231 (snake_case codes).
 */

/** The failure of a delivery's last attempt. */
export interface DeliveryError {
  /** `http_status`, `network`, `timeout` or `unsubscribed`. */
  readonly code: string;

  /** The consumer's HTTP status, when it answered. */
  readonly status?: number;
}
