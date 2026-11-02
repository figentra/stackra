/**
 * Stackra file contract:
 * Purpose: `registerProducerKeys`, how gen's inbox registration names the public keys a consumer accepts: for each
 *          producer this consumer pins, the keys its contract lists per environment.
 * Boundary: writes the process-wide `PRODUCER_KEYS`; registering a producer again replaces its keys. Nothing verifies
 *           until a request reaches the inbox.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02).
 */
import type { ProducerKey } from "#contracts/types/producer-key.type";
import { PRODUCER_KEYS } from "#core/constants/producer-keys.constant";

/**
 * Registers the public keys of the producers this consumer pins.
 *
 * @example
 * registerProducerKeys({ payments: { dev: [{ id: "pay-dev-1", publicKey: "…" }] } });
 */
export function registerProducerKeys(
  producers: Readonly<Record<string, Readonly<Record<string, readonly ProducerKey[]>>>>,
): void {
  for (const [producer, environments] of Object.entries(producers))
    PRODUCER_KEYS.set(producer, environments);
}
