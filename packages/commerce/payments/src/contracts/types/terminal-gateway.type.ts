/**
 * Stackra file contract:
 * Purpose: `TerminalGateway`, the port of a driver that presents an amount on a semi-integrated card terminal, with an
 *          optional tip prompt, and reads or cancels it.
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`. The terminal reads the card; the platform sees only the result.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 5 and 6); ADR 0339.
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

  /** Clears whatever the terminal is showing. */
  cancelTerminal(terminalId: string): Promise<void>;
}
