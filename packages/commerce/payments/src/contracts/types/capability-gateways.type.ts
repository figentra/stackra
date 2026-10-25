/**
 * Stackra file contract:
 * Purpose: `CapabilityGateways`, which port each `PaymentCapability` code stands for.
 * Boundary: a type map in the leaf entry; `hasCapability(gateway, code)` narrows a `PaymentGateway` with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */
import type { CaptureGateway } from "#contracts/types/capture-gateway.type";
import type { DisputeGateway } from "#contracts/types/dispute-gateway.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PayoutGateway } from "#contracts/types/payout-gateway.type";
import type { PlatformGateway } from "#contracts/types/platform-gateway.type";
import type { TerminalGateway } from "#contracts/types/terminal-gateway.type";
import type { TokenGateway } from "#contracts/types/token-gateway.type";

/**
 * Capability code to port.
 *
 * @example
 * type Tokens = CapabilityGateways["tokens"]; // TokenGateway
 */
export interface CapabilityGateways {
  /** A hosted checkout. */
  readonly checkout: PaymentGateway;

  /** Capture and void. */
  readonly capture: CaptureGateway;

  /** Saved-token charges. */
  readonly tokens: TokenGateway;

  /** Payouts. */
  readonly payouts: PayoutGateway;

  /** Merchant onboarding. */
  readonly platform: PlatformGateway;

  /** Disputes. */
  readonly disputes: DisputeGateway;

  /** Terminal sessions. */
  readonly terminal: TerminalGateway;

  /** A tip prompt on the terminal. */
  readonly terminal_tips: TerminalGateway;
}
