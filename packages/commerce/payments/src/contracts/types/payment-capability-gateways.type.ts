/**
 * Stackra file contract:
 * Purpose: `PaymentCapabilityGateways`, which port each `PaymentCapability` code stands for.
 * Boundary: a type map in the leaf entry; `hasPaymentCapability(gateway, code)` narrows a `PaymentGateway` with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0445; ADR 0446; STA-1024; STA-1383 (renamed from
 *                     `CapabilityGateways`).
 */
import type { CaptureGateway } from "#contracts/types/capture-gateway.type";
import type { DisputeGateway } from "#contracts/types/dispute-gateway.type";
import type { IncrementalAuthGateway } from "#contracts/types/incremental-auth-gateway.type";
import type { MethodsGateway } from "#contracts/types/methods-gateway.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PayoutGateway } from "#contracts/types/payout-gateway.type";
import type { PlatformGateway } from "#contracts/types/platform-gateway.type";
import type { PreAuthGateway } from "#contracts/types/pre-auth-gateway.type";
import type { TerminalGateway } from "#contracts/types/terminal-gateway.type";
import type { TokenGateway } from "#contracts/types/token-gateway.type";

/**
 * Capability code to port.
 *
 * @example
 * type Tokens = PaymentCapabilityGateways["tokens"]; // TokenGateway
 */
export interface PaymentCapabilityGateways {
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

  /** A restricted tender program; the program code travels on the request. */
  readonly restricted_tender: PaymentGateway;

  /** PIN entry on the terminal. */
  readonly terminal_pin: TerminalGateway;

  /** A terminal session a SoftPos phone collects. */
  readonly soft_pos: TerminalGateway;

  /** Holds an amount on a saved token. */
  readonly pre_auth: PreAuthGateway;

  /** Raises an authorised hold. */
  readonly incremental_auth: IncrementalAuthGateway;
}
