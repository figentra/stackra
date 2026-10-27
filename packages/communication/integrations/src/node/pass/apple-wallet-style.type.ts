/**
 * Stackra file contract:
 * Purpose: `AppleWalletStyle`, the Apple Wallet pass styles a pass kind maps to (`storeCard` for a loyalty card,
 *          `generic` for an award).
 * Boundary: a type only; which style a kind uses is deployment data in `AppleWalletOptions.styles`.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); Apple "PassKit Package Format Reference" (pass styles).
 */

/** The Apple Wallet pass styles. */
export type AppleWalletStyle = "boardingPass" | "coupon" | "eventTicket" | "generic" | "storeCard";
