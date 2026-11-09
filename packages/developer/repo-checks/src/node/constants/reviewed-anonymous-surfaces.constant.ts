/**
 * Stackra file contract:
 * Purpose: `REVIEWED_ANONYMOUS_SURFACES`, the anonymous-callable actions and queries a security review accepted as
 *          public endpoints, locked key to the reason it is safe without a session. `stackra validate` names only the
 *          calls missing here, so a new one still shows in review; the repository test fails until it is added.
 *          Product repositories' public calls are recorded here too (Figentra Pay's hosted checkout, STA-2515).
 * Boundary: data only. An entry is the review's record, not a switch: the call stays anonymous because its class
 *           lists `ActorKind.Anonymous`, and removing that removes the call from the notice whatever this says.
 * Runtime: node
 * Governing contract: ADR 0082 (public calls); ADR 0098 (the pipeline); STA-2025; reviewed 2026-11-04 (STA-2100);
 *                     Pay's checkout calls reviewed 2026-11-07 (STA-2515); the checkout's framers 2026-11-08 (STA-2564);
 *                     the checkout's method choice 2026-11-08; the checkout's details and terms submit 2026-11-09
 *                     (figentra/pay#194); Figentra Geo's three places reads 2026-11-09; Figentra Notify's marketing
 *                     opt-out link 2026-11-09; the OS landing lead form 2026-11-09 (os#233, os#267).
 */

/** Locked key to why an anonymous caller may make the call. */
export const REVIEWED_ANONYMOUS_SURFACES: Readonly<Record<string, string>> = Object.freeze({
  "achievements.award.verify@1":
    "the public certificate check (ADR 0432): read only, answers a live award's certificate fields for its secret " +
    "token or ~60-bit short code and nothing for a revoked or unknown one; the public area's rate-limit bucket bounds guessing",
  "analytics.analytics_batch.ingest@1":
    "the visitor analytics relay (ADR 0483): publishes only for a verified consent snapshot, keeps only deliveries " +
    "whose ids are the snapshot's subject, strips denyProperties, takes at most 100 deliveries and returns counts, never data",
  "checkouts.checkout_page.choose_method@1":
    "Binds the payer's method choice to an unguessable session id with a per-session rate limit; answers only the " +
    "bound provider session's widget; no data beyond that session.",
  "checkouts.checkout_page.submit@1":
    "Figentra Pay's hosted page sends the payer's details and terms acceptance (pay#194): anonymous only, and only " +
    "with the session's HMAC client token (key id, tenant, region, purpose, expiry, the path's session), checked as " +
    "load checks it, with the same refusal for any bad token or unknown session; runs in that tenant with row " +
    "security; a per-session bucket (10 a minute) bounds it; binds the session once under a row lock, so a repeat " +
    "records one acceptance and opens one provider session; the details go to payments in the call and are never " +
    "stored, logged or put in an event; the acceptance's IP address and user agent come from the call, never input",
  "checkouts.checkout_page.framers@1":
    "returns only the checkout's configured public embed origins, no tenant or payer data, fails closed (empty list) " +
    "on any miss; the edge's frame-ancestors callback (STA-2564). Reviewed by the leader, 2026-11-08.",
  "checkouts.checkout_page.load@1":
    "Figentra Pay's hosted checkout page (STA-2515): accepts only a session's HMAC client token (key id, tenant, " +
    "region, purpose, expiry) and runs in that tenant with row security; read only, no personal data; the same " +
    "refusal for any bad token or unknown session; 60 calls a minute; audit-logged",
  "consent.consent_snapshot.issue@1":
    "signs the visitor's own consent decision (ADR 0472): stores nothing, sets no cookie, binds a signed-in user's " +
    "id only, so an anonymous caller can sign nothing but its own claimed decision",
  "identity.passkey.challenge@1":
    "starts a passkey sign-in, which by definition has no session yet (ADR 0206 d8); 10 calls a minute. " +
    "an unknown login answers a same-shape decoy that verify refuses, so no login-existence signal (STA-2102)",
  "identity.passkey.verify@1":
    "finishes a passkey sign-in (ADR 0206 d7-8); the identity provider checks the signature against the challenge " +
    "session, a refusal is UnauthenticatedError, and the bearer token it answers is never logged; 10 calls a minute",
  "leads.lead.submit@1":
    "a Figentra landing's lead form (STA-2041): anonymous only through the landing's edge Worker, which checks the " +
    "challenge, maps the host to its tenant and signs the forwarded form, so the call runs in that verified tenant " +
    "with row security and a call without a signed scope has no tenant; 60 calls a minute per tenant; writes the " +
    "person, the consent answer with the words' SHA-256 and the lead, queues one escaped email to the product's " +
    "support address, and answers only that it arrived",
  "payment_links.payment_link.open@1":
    "a Figentra Pay link's page (STA-2515): takes only a short unguessable link id, resolved to its tenant through " +
    "the ids-only route table, opens a session there with row security; the same refusal for an unknown, paid, " +
    "expired, disabled or other-region link; no personal data; 20 calls a minute; audit-logged",
  "places.address.check@1":
    "Figentra Geo's address check at checkout (STA-742): read only; applies the stored rule of the address's " +
    "country and answers valid, the field issues and the printed lines; stores, logs and records nothing and calls " +
    "no maps provider, so a caller cannot spend Geo's provider quota; runs in the edge-signed tenant with row " +
    "security; the public area's rate-limit bucket bounds it",
  "places.location.pick@1":
    "Figentra Geo's location chain (Geo P1): a pure function of the caller's own input (device fix, saved address " +
    "point, the IP's point, the market) that picks the first known point; reads no table, stores nothing, locates no " +
    "IP itself and calls no provider; the public area's rate-limit bucket bounds it",
  "places.region.list@1":
    "Figentra Geo's ISO 3166-2 regions of a country for address forms (STA-2167): read only from a constant compiled " +
    "into the service, no table, no tenant or personal data, the same answer for every caller; the public area's " +
    "rate-limit bucket bounds it",
  "preferences.opt_out.apply@1":
    "Figentra Notify's one-tap marketing opt-out from a message's link and the mail client's one-click unsubscribe " +
    "(RFC 8058, P2 item 7): its only input is a token Notify signed with its contact key (HMAC, compared in constant " +
    "time) naming one contact's keyed fingerprint, its tenant, a one-time id and an expiry, so nobody can opt out a " +
    "contact they were not sent a link for; it only records an opt-out in that tenant, never removes one, and a " +
    "reused, expired or forged token is refused; answers only that the opt-out is recorded, no personal data; 30 " +
    "calls a minute; not a tool",
});
