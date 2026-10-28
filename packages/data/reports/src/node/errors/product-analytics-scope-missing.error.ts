/**
 * Stackra file contract:
 * Purpose: `ProductAnalyticsScopeMissingError`, the refusal of a product analytics query made outside a scoped call
 *          while the driver isolates by scope: with no scope to narrow to, it would read every scope's events.
 * Boundary: a refusal (`failed precondition`); it carries no field. A project that holds one scope's events sets the
 *           driver's scope property to `null` instead.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0140 (refusals); ADR 0323 (scope isolation).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A product analytics query ran outside a scoped call. */
export class ProductAnalyticsScopeMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
