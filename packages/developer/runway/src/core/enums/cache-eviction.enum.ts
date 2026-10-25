/**
 * Stackra file contract:
 * Purpose: the Valkey eviction policies, the values a service runway's `environments.<env>.cache.eviction` names
 *          for a dedicated cache.
 * Boundary: an `Enum.of` value plus the type of the same name; the codes keep the Valkey spelling (a tool-owned
 *           value), so runway passes them to the cache unchanged. The canonical service schema leaves `eviction` a
 *           free string (`volatile-ttl` and `allkeys-lru` are its examples), so `parseRunway` does not check it.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1: the cache eviction policy is a member size), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** The Valkey `maxmemory-policy` values. */
export const CacheEviction = Enum.of({
  /** Refuse writes when memory is full. */
  NoEviction: "noeviction",
  /** Evict the least recently used key. */
  AllKeysLru: "allkeys-lru",
  /** Evict the least frequently used key. */
  AllKeysLfu: "allkeys-lfu",
  /** Evict a random key. */
  AllKeysRandom: "allkeys-random",
  /** Evict the least recently used key that has a TTL. */
  VolatileLru: "volatile-lru",
  /** Evict the least frequently used key that has a TTL. */
  VolatileLfu: "volatile-lfu",
  /** Evict a random key that has a TTL. */
  VolatileRandom: "volatile-random",
  /** Evict the key with the nearest expiry. */
  VolatileTtl: "volatile-ttl",
});

/** One of the codes above. */
export type CacheEviction = Enum.Value<typeof CacheEviction>;
