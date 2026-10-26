/**
 * Stackra file contract:
 * Purpose: `ExitDecision`, what an exit gate decided for one presented credential: opened, or refused with the reason
 *          (not a receipt token, a bad signature, too old, another node's, already used, refused by the product's
 *          rule, or the gate did not open).
 * Boundary: a type only; `ExitGateService` reports one per credential, for the lane's attendant screen and the audit.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 2).
 */
import type { ReceiptTokenClaims } from "#contracts/types/receipt-token-claims.type";

/** One exit decision. */
export type ExitDecision =
  | { readonly opened: true; readonly claims: ReceiptTokenClaims }
  | {
      readonly opened: false;
      readonly reason: "malformed" | "signature" | "expired" | "node" | "used" | "rule" | "gate";
      readonly claims?: ReceiptTokenClaims | undefined;
    };
