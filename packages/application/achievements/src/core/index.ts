/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/achievements (the `AwardGranted` and `AwardRevoked` integration
 *          events, the two refusals, the `checkGrant` preview and the `verifyQr` code) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: a listener or a form imports it without the ORM.
 *           The shipped event schemas stay internal. The contracts are `./contracts`'; the models, services and the
 *           recipient registration are `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0368; the STA-347 stand-in barrel decision.
 */
export { AwardNotGrantableError } from "#core/errors/award-not-grantable.error";
export { AwardRevokedError } from "#core/errors/award-revoked.error";
export { AwardGranted } from "#core/events/award-granted.event";
export { AwardRevoked } from "#core/events/award-revoked.event";
export { checkGrant } from "#core/functions/check-grant.function";
export { verifyQr } from "#core/functions/verify-qr.function";
