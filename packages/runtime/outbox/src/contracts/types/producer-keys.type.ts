/**
 * Stackra file contract:
 * Purpose: `ProducerKeys`, the key table a consumer's inbox verifies with: for each producer service it pins, the
 *          public keys that producer lists per environment.
 * Boundary: a type only; gen emits the value from the pinned contracts' manifest `relay.keys`. Public facts.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02).
 */
import type { RelayKey } from "#contracts/types/relay-key.type";

/** Producer service to environment to its public keys, current first. */
export type ProducerKeys = Readonly<Record<string, Readonly<Record<string, readonly RelayKey[]>>>>;
