/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/achievements (`GrantRefusal`, the `RecipientRef` an
 *          award names, the `AwardRecipient` a consumer registers, and the `VerifiedAward` and `CertificateFields`
 *          shapes it reads) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0368; the STA-347 stand-in barrel decision.
 */
export { GrantRefusal } from "#contracts/enums/grant-refusal.enum";
export type { AwardRecipient } from "#contracts/types/award-recipient.type";
export type { CertificateFields } from "#contracts/types/certificate-fields.type";
export type { RecipientRef } from "#contracts/types/recipient-ref.type";
export type { VerifiedAward } from "#contracts/types/verified-award.type";
