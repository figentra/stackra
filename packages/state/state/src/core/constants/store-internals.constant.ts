/**
 * Stackra file contract:
 * Purpose: `STORE_INTERNALS`, the bookkeeping of every store instance, keyed by the instance.
 * Boundary: internal; written by the `Store` constructor, read through `internalsOf`. A weak map, so a dropped store is
 *           collected with its listeners.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2).
 */
import type { StoreInternals } from "#core/types/store-internals.type";

/** Store instance to its bookkeeping. */
export const STORE_INTERNALS = new WeakMap<object, StoreInternals>();
