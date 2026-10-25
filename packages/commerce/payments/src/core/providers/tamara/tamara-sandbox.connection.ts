/**
 * Stackra file contract:
 * Purpose: `TamaraSandboxConnection`, a Tamara sandbox merchant: the same driver as `TamaraConnection`, bound to the
 *          sandbox host's Integration.
 * Boundary: one connection class per Integration (ADR 0308 rule 2); it changes only the provider code.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 11); ADR 0308 (rule 2).
 */
import { TamaraConnection } from "#core/providers/tamara/tamara.connection";

/**
 * A Tamara sandbox merchant.
 *
 * @example
 * const connection = await store.find(TamaraSandboxConnection);
 */
export class TamaraSandboxConnection extends TamaraConnection {
  /** The sandbox Integration's provider code. */
  override get provider(): string {
    return "tamara-sandbox";
  }
}
