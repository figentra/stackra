/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/loyalty-kit (the ledger, members and tier policy ports,
 *          the three enums and the types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf every other entry may import.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { DebitOutcome } from "#contracts/enums/debit-outcome.enum";
export { EntryKind } from "#contracts/enums/entry-kind.enum";
export { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
export { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
export { LoyaltyMembers } from "#contracts/ports/loyalty-members.port";
export { LoyaltyTierPolicy } from "#contracts/ports/loyalty-tier-policy.port";
export type { EarnDraft } from "#contracts/types/earn-draft.type";
export type { EarnRequest } from "#contracts/types/earn-request.type";
export type { MemberId } from "#contracts/types/member-id.type";
export type { PointsEntry } from "#contracts/types/points-entry.type";
export type { RedemptionQuote } from "#contracts/types/redemption-quote.type";
export type { TierDraft } from "#contracts/types/tier-draft.type";
export type { VisitRequest } from "#contracts/types/visit-request.type";
