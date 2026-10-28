/**
 * Stackra file contract:
 * Purpose: `StripeTerminalServer`, what the device asks the server for before Stripe Terminal can work: a connection
 *          token minted over the tenant's Stripe payment Connection, and the Stripe location of this site.
 * Boundary: an abstract class that is its own token, key `native_card_terminal.StripeTerminalServer`. The host binds it
 *           over its server actions (OS integrations, STA-664); this package never holds a Stripe secret key, a
 *           restricted key or an account id. Both calls reject when the server cannot answer; a failure is never
 *           answered with a stored value.
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decision 4); ADR 0442 (decision 6); ADR 0446 (decision 3).
 */
import { Port } from "@stackra/contracts";

/**
 * The server side of Stripe Terminal, as the app reaches it.
 *
 * @example
 * export class ServerStripeTerminalServerDriver extends Driver(StripeTerminalServer) { … } // over the payments client
 * const token = await server.connectionToken(); // a short-lived `pst_…` secret, used once by the SDK
 */
export abstract class StripeTerminalServer extends Port {
  /** Type-only port key. */
  declare readonly "~key": "native_card_terminal.StripeTerminalServer";

  /**
   * A fresh connection token for the SDK.
   *
   * @throws Error when the server or the Connection refuses; the SDK is then told the fetch failed.
   */
  abstract connectionToken(): Promise<string>;

  /**
   * The Stripe location (`tml_…`) a reader of this site connects at, a site setting on the server.
   *
   * @throws Error when the site has no location set.
   */
  abstract locationId(): Promise<string>;
}
