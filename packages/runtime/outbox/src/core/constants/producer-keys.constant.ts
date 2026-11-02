/**
 * Stackra file contract:
 * Purpose: `PRODUCER_KEYS`, the process-wide table of the public keys a consumer's inbox accepts: producer service to
 *          its keys per environment, as the producers' contracts this consumer pins list them.
 * Boundary: internal; written only by `registerProducerKeys`, which gen's inbox registration calls, and read by the
 *           `contract` inbox verifier. Empty in a service that pins no producer with cross-app events.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02).
 */
import type { ProducerKey } from "#contracts/types/producer-key.type";

/** Producer service to environment to its public keys, current first. */
export const PRODUCER_KEYS = new Map<string, Readonly<Record<string, readonly ProducerKey[]>>>();
