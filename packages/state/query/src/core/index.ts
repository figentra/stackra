/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/query (the configuration with its shipped schema, the offline
 *          settings, the key scope, `offlineMap`, `registerReplicas`, the mutation queue, the server-state cache, the
 *          replica store, the offline lock, the storage persister and the `offline` refusal) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under the generated name
 *           (`QueryConfig$`) a host's generated schemas extend. The ports are the `./contracts` entry's; the queue's
 *           record types (`PendingMutation`, `ConflictRecord`) and `ReplicaSnapshot` are the `./react` entry's (one
 *           symbol, one entry).
 *           `QueryPersisterName` and `QueueLeaderName` carry the `DriverRegistry` augmentation, so exporting them loads
 *           it for every consumer.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { QueryConfig } from "#config/query.config";
export { QUERY_CONFIG_SCHEMA as QueryConfig$ } from "#core/constants/query-config-schema.constant";
export { StorageQueryPersisterDriver } from "#core/drivers/storage-query-persister.driver";
export { QueryScope } from "#core/enums/query-scope.enum";
export { OfflineError } from "#core/errors/offline.error";
export { offlineMap } from "#core/functions/offline-map.function";
export { registerReplicas } from "#core/functions/register-replicas.function";
export { QuerySettings } from "#core/query.settings";
export { QueryOptions } from "#core/schemas/query-options.schema";
export { MutationQueue } from "#core/services/mutation-queue.service";
export { OfflineLock } from "#core/services/offline-lock.service";
export { ReplicaStore } from "#core/services/replica-store.service";
export { ServerStateCache } from "#core/services/server-state-cache.service";
export type { LiveQueryRef } from "#core/types/live-query-ref.type";
export type { OfflineActionRef } from "#core/types/offline-action-ref.type";
export type { OfflineCap } from "#core/types/offline-cap.type";
export type { OfflineEntry } from "#core/types/offline-entry.type";
export type { OfflineMap } from "#core/types/offline-map.type";
export type { QueryPartition } from "#core/types/query-partition.type";
export type { QueryPersisterName } from "#core/types/query-persister-name.type";
export type { QueueLeaderName } from "#core/types/queue-leader-name.type";
export type { ReplicaOptions } from "#core/types/replica-options.type";
export type { ReplicaRef } from "#core/types/replica-ref.type";
