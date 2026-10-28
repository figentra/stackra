/**
 * Stackra file contract:
 * Purpose: `ProductAnalyticsUnavailableError`, the failure of a product analytics query the store could not answer:
 *          the driver is not configured, its key secret is not bound, the store answered an error status or a shape
 *          the driver does not read.
 * Boundary: a refusal (`unavailable`, retryable); `driver` names the driver and `reason` what failed. It never
 *           carries the key or the store's response body.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0140 (refusals); ADR 0173 (secrets never
 *                     logged).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The product analytics store could not answer. */
export class ProductAnalyticsUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The driver name, such as `posthog`. */
  driver!: string;

  /** What failed, such as `PostHog answered 503`. */
  reason!: string;
}
