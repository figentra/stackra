/**
 * Stackra file contract:
 * Purpose: `SoftPos`, the port of the SoftPos driver family: the staff app's phone reads a contactless card for a
 *          terminal payment the server opened, and can be cancelled. The server half (open the session, capture,
 *          cancel and reconcile) stays on `PaymentService`.
 * Boundary: an abstract class that is its own token, key `payments.SoftPos`, bound on the device (the Expo staff app).
 *           One driver per provider SDK (`stripe-tap-to-pay`; a Gulf SDK per pack later); which one a Market uses is
 *           pack data and device eligibility comes from the device catalogue, both the host's. The card never reaches
 *           the platform; the driver hands back only the provider's result. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0378 (decisions 2 and 5); ADR 0294 (decision 16); R3-SO-12; STA-694.
 */
import { Port } from "@stackra/contracts";

import type { SoftPosReadiness } from "#contracts/types/soft-pos-readiness.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";

/**
 * Tap to pay on the phone.
 *
 * @example
 * const session = await payments.startTerminal(market, { reference, terminalId, amount, softPos: true }); // server
 * const read = await softPos.collect(session); // phone
 */
export abstract class SoftPos extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.SoftPos";

  /** Whether this phone can collect now (supported device, entitlement, connected reader). */
  abstract readiness(): Promise<SoftPosReadiness>;

  /**
   * Makes this phone the reader at `location` (the provider's id of the site, a till setting).
   *
   * @throws SoftPosUnavailableError when the phone cannot be a reader.
   */
  abstract connect(location: string): Promise<void>;

  /**
   * Reads the card for `session` and lets the provider decide.
   *
   * @returns the session with the provider's state (`authorized` when a capture follows).
   * @throws PaymentFieldRequiredError when the session has no `clientSecret`.
   * @throws PaymentDeclinedError when the read or the provider turns it down (a cancel included).
   */
  abstract collect(session: TerminalSession): Promise<TerminalSession>;

  /** Stops a read in progress; the server's `cancelTerminal` then reconciles. */
  abstract cancel(): Promise<void>;
}
