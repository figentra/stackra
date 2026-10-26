/**
 * Stackra file contract:
 * Purpose: `PaymobKsaConnection`, a Paymob account on the Saudi Arabia host: the same driver as `PaymobConnection`,
 *          bound to `PaymobKsaIntegration`, with its Unified Checkout page on the same host.
 * Boundary: one connection class per Integration (ADR 0308 rule 2); it changes only the provider code the engine
 *           stores and the checkout origin.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 2); spec task T012.
 */
import { PaymobConnection } from "#core/providers/paymob/paymob.connection";

/**
 * A Paymob account in Saudi Arabia.
 *
 * @example
 * const connection = await store.find(PaymobKsaConnection);
 */
export class PaymobKsaConnection extends PaymobConnection {
  /** The regional Integration's provider code. */
  override get provider(): string {
    return "paymob-ksa";
  }

  /** The regional host. */
  protected override get checkoutOrigin(): string {
    return "https://ksa.paymob.com";
  }
}
