/**
 * Stackra file contract:
 * Purpose: `ProductAnalyticsQueryInvalidError`, the refusal of a funnel, retention or cohort query that is malformed:
 *          a bad step count, range, window, period, interval count, event name or property match.
 * Boundary: a refusal (`validation`); `query` is `funnel`, `retention` or `cohort` and `reason` says what is wrong. It
 *           never echoes a property value.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0140 (refusals); ADR 0328 (built with
 *                     `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A product analytics query is malformed. */
export class ProductAnalyticsQueryInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** `funnel`, `retention` or `cohort`. */
  query!: string;

  /** What is wrong, such as `a funnel takes 2 to 20 steps`. */
  reason!: string;
}
