/**
 * Stackra file contract:
 * Purpose: `THREAT_MODEL`, where a member's threat model lives, the platform page that links every one, and which
 *          members of the Stackra repository must keep one (constitution SEC10): every member under a
 *          `prefixes` folder, and the `members` listed by name because they authenticate, authorise, hold secrets,
 *          verify third-party input or run untrusted code.
 * Boundary: data only. A member leaves this list only by a change that also removes it from the platform page.
 * Runtime: node
 * Governing contract: constitution SEC10 (security, "Threat model template"); ADR 0207 (amendment of 2026-11-26:
 *                     the ASVS level); STA-316.
 */

/** The threat-model file of a member, the platform page, and the members that must keep one. */
export const THREAT_MODEL = Object.freeze({
  /** The member-relative path of a threat model. */
  file: "docs/threat-model.md",
  /** The platform threat model, which links every member's model by its repository path. */
  page: "apps/docs/src/docs/customers/threat-model.mdx",
  /** Every member below one of these folders keeps a threat model, so a new security package cannot skip one. */
  prefixes: Object.freeze(["packages/security/"]),
  /** Members outside those folders that keep one: each sits on a trust boundary of the platform model. */
  members: Object.freeze([
    "packages/application/actions",
    "packages/application/ai",
    "packages/commerce/payments",
    "packages/communication/integrations",
    "packages/communication/webhooks",
    "packages/data/media",
    "packages/foundation/config",
    "packages/runtime/app",
    "packages/runtime/sandbox",
  ]),
});
