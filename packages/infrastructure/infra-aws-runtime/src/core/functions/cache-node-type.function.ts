/**
 * Stackra file contract:
 * Purpose: `cacheNodeType(memoryMb)`, the smallest ElastiCache node whose usable memory holds a member's
 *          `environments.<env>.cache.memoryMb`. Usable memory is three quarters of the node's: ElastiCache's default
 *          parameter groups reserve 25% (`reserved-memory-percent`) for replication and snapshots.
 * Boundary: internal; pure. Returns `undefined` when no node is big enough, so the caller can name the runway path.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1: the cache size is a member size).
 */
import { CACHE_NODE_TYPES } from "#core/constants/cache-node-types.constant";

/** The share of a node's memory the cache may fill. */
const USABLE_SHARE = 0.75;

/**
 * The node type for `memoryMb`; the smallest node when no size is given.
 *
 * @param memoryMb - the member's cache size, or `undefined`.
 * @example
 * cacheNodeType(256); // "cache.t4g.micro"
 * cacheNodeType(1024); // "cache.t4g.small"
 */
export function cacheNodeType(memoryMb: number | undefined): string | undefined {
  return CACHE_NODE_TYPES.find((node) => node.memoryMb * USABLE_SHARE >= (memoryMb ?? 0))?.type;
}
