/**
 * Stackra file contract:
 * Purpose: `REVIEWED_ANONYMOUS_SURFACES`, the anonymous-callable actions and queries a security review accepted as
 *          public endpoints, locked key to the reason it is safe without a session. `stackra validate` names only the
 *          calls missing here, so a new one still shows in review; the repository test fails until it is added.
 * Boundary: data only. An entry is the review's record, not a switch: the call stays anonymous because its class
 *           lists `ActorKind.Anonymous`, and removing that removes the call from the notice whatever this says.
 * Runtime: node
 * Governing contract: ADR 0082 (public calls); ADR 0098 (the pipeline); STA-2025; reviewed 2026-11-04 (STA-2100).
 */

/** Locked key to why an anonymous caller may make the call. */
export const REVIEWED_ANONYMOUS_SURFACES: Readonly<Record<string, string>> = Object.freeze({
  "achievements.award.verify@1":
    "the public certificate check (ADR 0432): read only, answers a live award's certificate fields for its secret " +
    "token or ~60-bit short code and nothing for a revoked or unknown one; the public area's rate-limit bucket bounds guessing",
  "analytics.analytics_batch.ingest@1":
    "the visitor analytics relay (ADR 0483): publishes only for a verified consent snapshot, keeps only deliveries " +
    "whose ids are the snapshot's subject, strips denyProperties, takes at most 100 deliveries and returns counts, never data",
  "consent.consent_snapshot.issue@1":
    "signs the visitor's own consent decision (ADR 0472): stores nothing, sets no cookie, binds a signed-in user's " +
    "id only, so an anonymous caller can sign nothing but its own claimed decision",
  "identity.passkey.challenge@1":
    "starts a passkey sign-in, which by definition has no session yet (ADR 0206 d8); 10 calls a minute. " +
    "Follow-up STA-2102: an unknown login answers UnauthenticatedError, a login-existence signal the bucket only slows",
  "identity.passkey.verify@1":
    "finishes a passkey sign-in (ADR 0206 d7-8); the identity provider checks the signature against the challenge " +
    "session, a refusal is UnauthenticatedError, and the bearer token it answers is never logged; 10 calls a minute",
});
