/**
 * Stackra file contract:
 * Purpose: `CrossAppKeyMissingError` (`cross_app_key_missing`), thrown when a producer has a cross-app delivery to sign
 *          but no signing key or key id is set for its environment.
 * Boundary: a refusal of the relay, never answered to a caller: the delivery records it and retries, so a key set later
 *           lets it through, and it is dead-lettered (and replayable) if none is. The message names no key.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 16, amendment of 2026-11-02); ADR 0140; ADR 0173.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The producer's signing key or its id is not set.
 *
 * @example
 * throw CrossAppKeyMissingError.create({});
 */
export class CrossAppKeyMissingError extends Refusal({
  kind: ErrorKind.Internal,
  retryable: true,
}) {}
