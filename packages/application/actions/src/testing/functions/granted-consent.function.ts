/**
 * Stackra file contract:
 * Purpose: `grantedConsent(...categories)`, a verified `CallConsent` granting `necessary` and `categories`, for a unit
 *          test that hands `fakeActionContext({ consent })` a visitor who accepted (ADR 0472).
 * Boundary: test only: it signs nothing and verifies nothing. The snapshot id and subject are fixed test values and the
 *           expiry is a day after the current (possibly frozen) clock. A test of a refusal keeps the fake's default.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0472 (decisions 3 and 4).
 */
import type { CallConsent } from "#contracts/types/call-consent.type";

/**
 * A `ctx.consent` that resolves to a verified snapshot granting `categories`.
 *
 * @example
 * const ctx = fakeActionContext({ consent: grantedConsent("analytics") });
 * await service.track(input, ctx); // sends: analytics is granted
 */
export function grantedConsent(...categories: readonly string[]): () => Promise<CallConsent> {
  const consent: CallConsent = Object.freeze({
    verified: true,
    snapshotId: "csn_test",
    subject: "anon_test",
    granted: Object.freeze([...new Set(["necessary", ...categories])]),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return async () => consent;
}
