/**
 * Stackra file contract:
 * Purpose: `OFFLINE_POLICIES`, the offline policies the client's generated offline map declared, by versioned action
 *          key: what the mutation queue reads to accept or refuse a call.
 * Boundary: internal module state, filled only by `offlineMap`, which the generated `#stackra/offline` calls once at
 *           boot; a later entry for the same key replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2); the gen-wired registries of ADR 0294 (decision 17).
 */
import type { OfflineEntry } from "#core/types/offline-entry.type";

/** Action key to its offline policy. */
export const OFFLINE_POLICIES = new Map<string, OfflineEntry>();
