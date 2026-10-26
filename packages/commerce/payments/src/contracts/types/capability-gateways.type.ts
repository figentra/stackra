/**
 * Stackra file contract:
 * Purpose: `CapabilityGateways`, which port each `PaymentCapability` code stands for.
 * Boundary: a type map in the leaf entry; `hasCapability(gateway, code)` narrows a `PaymentGateway` with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */
import type { CaptureGateway } from "#contracts/types/capture-gateway.type";
import type { DisputeGateway } from "#contracts/types/dispute-gateway.type";
import type { MethodsGateway } from "#contracts/types/methods-gateway.type";
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

  /** Charges a saved payment token. */
  readonly tokens: TokenGateway;

  /** Sends payouts to a destination. */
  readonly payouts: PayoutGateway;

  /** Onboards and reads merchant accounts. */
  readonly platform: PlatformGateway;

  /** Reads and answers disputes. */
  readonly disputes: DisputeGateway;

  /** Runs in-person terminal sessions. */
  readonly terminal: TerminalGateway;

  /** A tip prompt on the terminal. */
  readonly terminal_tips: TerminalGateway;

  /** The account's enabled payment methods. */
  readonly methods: MethodsGateway;
}
