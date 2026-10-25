/**
 * Stackra file contract:
 * Purpose: `IDEMPOTENCY_TTL`, how long the idempotency step keeps a key with its fingerprint and result: 24 hours.
 * Boundary: a constant passed to `IdempotencyStore.claim`; a key reused after it expires runs as a new call.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: stored for 24 hours).
 */
import { Duration } from "@stackra/contracts";

/** How long an Idempotency-Key is kept: twenty-four hours. */
export const IDEMPOTENCY_TTL = Duration.hours(24);
