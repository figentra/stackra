/**
 * Stackra file contract:
 * Purpose: `HyperpaySandboxConnection`, a HyperPay test entity: the same driver as `HyperpayConnection`, bound to the
 *          test host's Integration, loading the widget from the test host.
 * Boundary: one connection class per Integration (ADR 0308 rule 2); it changes only the provider code and origin.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 11); ADR 0308 (rule 2).
 */
import { HyperpayConnection } from "#core/providers/hyperpay/hyperpay.connection";

/**
 * A HyperPay test entity.
 *
 * @example
 * const connection = await store.find(HyperpaySandboxConnection);
 */
export class HyperpaySandboxConnection extends HyperpayConnection {
  /** The sandbox Integration's provider code. */
  override get provider(): string {
    return "hyperpay-sandbox";
  }

  /** The test host. */
  override get origin(): string {
    return "https://eu-test.oppwa.com";
  }
}
