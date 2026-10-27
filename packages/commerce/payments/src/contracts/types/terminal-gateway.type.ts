/**
 * Stackra file contract:
 * Purpose: `TerminalGateway`, the port of a driver that presents an amount on a semi-integrated card terminal, with an
 *          optional tip prompt, and reads or cancels it. The cancel carries the session's `providerRef` when the
 *          engine has one, since a cloud terminal API cancels a checkout by its id, not the reader's (Square Terminal
 *          checkouts, Adyen's Terminal API abort; stackra-34).
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`. The terminal reads the card; the platform sees only the result.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 5 and 6); ADR 0339; ADR 0378 (decisions 3 and 4).
 */
import type { TerminalRequest } from "#contracts/types/terminal-request.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";

/**
 * Terminal sessions (`PaymentCapability.Terminal`).
 *
 * @example
 * const session = await gateway.startTerminal({ reference, terminalId, amount });
 */
export interface TerminalGateway {
  /** Presents the amount on the terminal. */
  startTerminal(request: TerminalRequest): Promise<TerminalSession>;

  /** The session as the provider holds it now. */
  terminalSession(providerRef: string, terminalId: string): Promise<TerminalSession>;

  /**
   * Clears what the terminal is showing: the session `providerRef` when given, else whatever is on `terminalId`.
   */
  cancelTerminal(terminalId: string, providerRef?: string): Promise<void>;
}
