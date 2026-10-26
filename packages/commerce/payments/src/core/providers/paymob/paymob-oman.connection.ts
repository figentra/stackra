/**
 * Stackra file contract:
 * Purpose: `PaymobOmanConnection`, a Paymob account on the Oman host: the same driver as `PaymobConnection`,
 *          bound to `PaymobOmanIntegration`, with its Unified Checkout page on the same host.
 * Boundary: one connection class per Integration (ADR 0308 rule 2); it changes only the provider code the engine
 *           stores and the checkout origin.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 2); spec task T012.
 */
import { PaymobConnection } from "#core/providers/paymob/paymob.connection";

/**
 * A Paymob account in Oman.
 *
 * @example
 * const connection = await store.find(PaymobOmanConnection);
 */
export class PaymobOmanConnection extends PaymobConnection {
  /** The regional Integration's provider code. */
  override get provider(): string {
    return "paymob-oman";
  }

  /** The regional host. */
  protected override get checkoutOrigin(): string {
    return "https://oman.paymob.com";
  }
}
