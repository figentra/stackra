/**
 * Stackra file contract:
 * Purpose: `CALL_HEADERS`, the request headers a transport lifts onto `CallOptions` as sent: `Idempotency-Key`
 *          (`idempotencyKey`) and `Stackra-Consent` (`consentSnapshot`).
 * Boundary: frozen; names only (HTTP compares them case-insensitively, `Headers` too). Only headers whose value the
 *           pipeline checks itself are here; the actor, scope, device and origin come from the verified credential,
 *           never from a header read this way (ADR 0098). This package does not import @stackra/consent (which depends
 *           on it), so `CONSENT_SNAPSHOT_HEADER` there is this entry's `consentSnapshot`. In this leaf entry, so a browser
 *           client reads the names without the pipeline.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (the idempotency step); ADR 0472 (decision 3); ADR 0098 (decisions 6 and 7).
 */

/**
 * The header names `requestCallOptions` reads.
 *
 * @example
 * request.headers.get(CALL_HEADERS.consentSnapshot);
 */
export const CALL_HEADERS = Object.freeze({
  /** One key per logical call, kept across retries. */
  idempotencyKey: "Idempotency-Key",
  /** The signed consent snapshot the client was issued (ADR 0472). */
  consentSnapshot: "Stackra-Consent",
} as const);
