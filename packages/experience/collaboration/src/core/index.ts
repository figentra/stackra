/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/collaboration (the configuration with its shipped schema, the
 *          entitlement this package contributes, `CollaborationSession` and `SnapshotService`) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The ports and their types are the `./contracts` entry's; the
 *           memory drivers are the `./testing` entry's; the Yjs binding is the `./react` entry's (one symbol, one
 *           entry), so this entry loads no CRDT library. The shipped schema is re-exported under its generated name
 *           (`CollaborationConfig$`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CollaborationConfig } from "#config/collaboration.config";
export { LiveCollaborationEntitlement } from "#core/access/live-collaboration.entitlement";
export { COLLABORATION_CONFIG_SCHEMA as CollaborationConfig$ } from "#core/constants/collaboration-config-schema.constant";
export { CollaborationOptions } from "#core/schemas/collaboration-options.schema";
export { CollaborationSession } from "#core/services/collaboration-session.service";
export { SnapshotService } from "#core/services/snapshot.service";
export type { CollaborationRoomState } from "#core/types/collaboration-room-state.type";
