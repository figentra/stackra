/**
 * Stackra file contract:
 * Purpose: `CheckoutSandboxConnection`, a Checkout.com sandbox account: the same driver as `CheckoutConnection`,
 *          bound to the sandbox host's Integration.
 * Boundary: one connection class per Integration (ADR 0308 rule 2), so the sandbox has its own; it changes only the
 *           provider code the engine stores.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 11); ADR 0308 (rule 2).
 */
import { CheckoutConnection } from "#core/providers/checkout/checkout.connection";

/**
 * A Checkout.com sandbox account.
 *
 * @example
 * const connection = await store.find(CheckoutSandboxConnection);
 */
export class CheckoutSandboxConnection extends CheckoutConnection {
  /** The sandbox Integration's provider code. */
  override get provider(): string {
    return "checkout-sandbox";
  }
}
