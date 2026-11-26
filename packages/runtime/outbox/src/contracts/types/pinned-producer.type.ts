/**
 * Stackra file contract:
 * Purpose: `PinnedProducer`, what a consumer's inbox knows of one producer it pins: the public keys it lists per
 *          environment and the integration events it publishes (versioned wire names).
 * Boundary: a type only; gen emits it from the pinned contract's manifest (`relay.keys` and its events). Public facts.
 *           The inbox accepts a delivery only when a listed key signed it and its type is one of that producer's.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02).
 */
import type { RelayKey } from "#contracts/types/relay-key.type";

/** One pinned producer's keys and events. */
export interface PinnedProducer {
  /** Environment to its public keys, current first. */
  readonly keys: Readonly<Record<string, readonly RelayKey[]>>;

  /** The versioned wire names it publishes (`payments.payment.captured.v2`). */
  readonly events: readonly string[];
}
