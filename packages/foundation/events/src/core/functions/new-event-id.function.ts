/**
 * Stackra file contract:
 * Purpose: `newEventId`, the id of an occurrence that came with none: `mintPublicId("evt")`, so bus, action and
 *          outbox event ids share one form (`evt_` and 26 lowercase Crockford base32 characters of a UUIDv7).
 * Boundary: delegates to `mintPublicId` of `@stackra/contracts`; `freezeIds()` and `freezeClock()` from
 *           `@stackra/testing` make its random part repeat in a test. Internal: the bus calls it; not exported from
 *           the entry. Older uppercase ids stay valid, since consumers compare ids as strings.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public ids: `<prefix>_<26 characters>`); ADR 0141 (decision 2: the envelope `id`);
 *                     STA-1380 (one public-id minter).
 */
import { mintPublicId } from "@stackra/contracts";

/**
 * A fresh event id, later than every id this process minted before.
 *
 * @example
 * newEventId(); // "evt_01jab3k4m5n6p7q8r9s0t1v2w3"
 */
export function newEventId(): string {
  return mintPublicId("evt");
}
