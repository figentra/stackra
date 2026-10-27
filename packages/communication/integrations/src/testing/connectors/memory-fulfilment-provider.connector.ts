/**
 * Stackra file contract:
 * Purpose: `MemoryFulfilmentProvider`, the memory driver of the `FulfilmentProviderConnector` contract (a 3PL or WMS
 *          in this process): one fulfilment per reference, its state read back, cancelled until it ships, and
 *          `ship` to play the warehouse, so an order's hand-over runs end to end in a test or a local host.
 * Boundary: a plain class implementing the contract, not a Connection: no credential and no provider call (vendor
 *           Connections are OS integrations connectors, R3-8). An unknown `providerRef` and a cancel after shipping
 *           are refused as a provider refuses them (`ProviderRefusedError`, 404 `not_found` and 409 `shipped`).
 *           Fulfilments are `ful_<n>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver per capability); ADR 0269 (decision 3); ADR 0447
 *                     (decision 2); STA-904; COM-147.
 */
import type { Fulfilment, FulfilmentProviderConnector, FulfilmentRequest } from "#contracts/index";
import { ProviderRefusedError } from "#core/index";

/**
 * A fulfilment provider in memory.
 *
 * @example
 * const threePl = new MemoryFulfilmentProvider();
 * const fulfilment = await threePl.create(request);
 * threePl.ship(fulfilment.providerRef, "aramex", "AX123");
 */
export class MemoryFulfilmentProvider implements FulfilmentProviderConnector {
  /** Every request handed over, oldest first, once per reference. */
  readonly received: FulfilmentRequest[] = [];

  /** Provider ref to its fulfilment. */
  private readonly fulfilments = new Map<string, Fulfilment>();

  /** Our reference to the provider ref. */
  private readonly byReference = new Map<string, string>();

  /** Accepts `request` once per reference. */
  async create(request: FulfilmentRequest): Promise<Fulfilment> {
    const known = this.byReference.get(request.reference);
    if (known !== undefined) return this.get(known);
    const providerRef = `ful_${this.fulfilments.size + 1}`;
    this.received.push(request);
    this.byReference.set(request.reference, providerRef);
    return this.put({ providerRef, state: "accepted" });
  }

  /** The fulfilment `providerRef` as it is now. */
  async status(providerRef: string): Promise<Fulfilment> {
    return this.get(providerRef);
  }

  /** Cancels `providerRef` unless it shipped; a cancelled one stays cancelled. */
  async cancel(providerRef: string): Promise<Fulfilment> {
    const current = this.get(providerRef);
    if (current.state === "shipped")
      throw ProviderRefusedError.create({ provider: "memory", status: 409, code: "shipped" });
    return this.put({ providerRef, state: "cancelled" });
  }

  /** Plays the warehouse: marks `providerRef` shipped with `carrier` and `trackingNumber`. */
  ship(providerRef: string, carrier: string, trackingNumber: string): Fulfilment {
    this.get(providerRef);
    return this.put({ providerRef, state: "shipped", carrier, trackingNumber });
  }

  /** The stored fulfilment, or the provider's not-found refusal. */
  private get(providerRef: string): Fulfilment {
    const found = this.fulfilments.get(providerRef);
    if (found === undefined)
      throw ProviderRefusedError.create({ provider: "memory", status: 404, code: "not_found" });
    return found;
  }

  /** Stores and returns `fulfilment`, frozen. */
  private put(fulfilment: Fulfilment): Fulfilment {
    const frozen = Object.freeze(fulfilment);
    this.fulfilments.set(fulfilment.providerRef, frozen);
    return frozen;
  }
}
