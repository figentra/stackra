/**
 * Stackra file contract:
 * Purpose: `ApiKeyRejectedError`, an API key that is malformed, of the wrong kind, or used from an origin it is not bound to
 *          (`api_key_rejected`).
 * Boundary: kind `Unauthenticated`, retryable false. It never names another person or what a record holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 4, 5 and 7); COM-56; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal.
 *
 * @example
 * throw ApiKeyRejectedError.create();
 */
export class ApiKeyRejectedError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: false,
}) {}
