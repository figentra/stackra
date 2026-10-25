/**
 * Stackra file contract:
 * Purpose: `REPLICAS`, the queries the client keeps as bounded replicas, by versioned key: what `ReplicaStore` fills and
 *          refreshes, and the only queries available offline (ADR 0338 decision 3).
 * Boundary: internal module state, filled only by `registerReplicas`, which a generated query class calls when it
 *           loads; a later entry for the same key replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); the gen-wired registries of ADR 0294 (decision 17).
 */
import type { ReplicaRef } from "#core/types/replica-ref.type";

/** Query key to its replica class. */
export const REPLICAS = new Map<string, ReplicaRef>();
