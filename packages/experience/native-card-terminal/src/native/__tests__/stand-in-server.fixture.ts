/**
 * Stackra file contract:
 * Purpose: `StandInServer`, a `StripeTerminalServer` for the `./native` tests: it answers a test connection token and
 *          a test location, or refuses either when told to, and records every call.
 * Boundary: test only; the token is a placeholder string, never a real Stripe secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 4); ADR 0022 (test placement).
 */
import { StripeTerminalServer } from "#contracts/ports/stripe-terminal-server.port";

/** The server side, in memory. */
export class StandInServer extends StripeTerminalServer {
  /** Whether `connectionToken` refuses. */
  isRefusingTokens = false;

  /** The location the site has; null when none is set. */
  location: string | null = "tml_stand_in";

  /** How many tokens were asked for. */
  tokenCalls = 0;

  /** A placeholder token, or a rejection while `isRefusingTokens`. */
  async connectionToken(): Promise<string> {
    this.tokenCalls += 1;
    if (this.isRefusingTokens) throw new Error("connection refused at the server");
    return `stand_in_token_${this.tokenCalls}`;
  }

  /** `location`, or a rejection when it is null. */
  async locationId(): Promise<string> {
    if (this.location === null) throw new Error("no Stripe location set for this site");
    return this.location;
  }
}
