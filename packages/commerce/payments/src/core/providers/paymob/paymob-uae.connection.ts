/**
 * Stackra file contract:
 * Purpose: `PaymobUaeConnection`, a Paymob account on the the United Arab Emirates host: the same driver as `PaymobConnection`,
 *          bound to `PaymobUaeIntegration`, with its Unified Checkout page on the same host.
 * Boundary: one connection class per Integration (ADR 0308 rule 2); it changes only the provider code the engine
 *           stores and the checkout origin.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 2); spec task T012.
 */
import { PaymobConnection } from "#core/providers/paymob/paymob.connection";

/**
 * A Paymob account in the United Arab Emirates.
 *
 * @example
 * const connection = await store.find(PaymobUaeConnection);
 */
export class PaymobUaeConnection extends PaymobConnection {
  /** The regional Integration's provider code. */
  override get provider(): string {
    return "paymob-uae";
  }

  /** The regional host. */
  protected override get checkoutOrigin(): string {
    return "https://uae.paymob.com";
  }
}
