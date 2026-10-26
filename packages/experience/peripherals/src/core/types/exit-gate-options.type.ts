/**
 * Stackra file contract:
 * Purpose: `ExitGateOptions`, what a lane gives `ExitGateService.start`: the node the gate stands in, the product's
 *          rule (its rule set, evaluated by the caller) and where each decision is reported.
 * Boundary: a type only. The node and the rule are data the device's settings and the product's rule sets hold.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 2); config-model (gate rules are rule sets).
 */
import type { ExitDecision } from "#contracts/types/exit-decision.type";
import type { ReceiptTokenClaims } from "#contracts/types/receipt-token-claims.type";

/** The options of an exit gate. */
export interface ExitGateOptions {
  /** The tenancy node the gate stands in; a receipt from another node is refused. */
  readonly nodeId: string;
  /** The product's rule set for this exit (a paid receipt, an age check done); true lets the token through. */
  readonly admit?: ((claims: ReceiptTokenClaims) => boolean | Promise<boolean>) | undefined;
  /** Called with every decision, for the attendant's screen and the audit. */
  readonly onDecision?: ((decision: ExitDecision) => void) | undefined;
}
