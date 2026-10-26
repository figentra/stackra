/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/collaboration (the `PresenceChannel`, `SyncTransport`
 *          `SnapshotStore` and `MentionDirectory` ports, the comment enums and the types they speak, including the Yjs-free `DocumentReplica` seam) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package and
 *           no CRDT library (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
export { MentionKind } from "#contracts/enums/mention-kind.enum";
export { ThreadStatus } from "#contracts/enums/thread-status.enum";
export { MentionDirectory } from "#contracts/ports/mention-directory.port";
export { PresenceChannel } from "#contracts/ports/presence-channel.port";
export { RoomTokens } from "#contracts/ports/room-tokens.port";
export { SnapshotStore } from "#contracts/ports/snapshot-store.port";
export { SyncTransport } from "#contracts/ports/sync-transport.port";
export type { CollaborationCursor } from "#contracts/types/collaboration-cursor.type";
export type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
export type { CommentRules } from "#contracts/types/comment-rules.type";
export type { CommentView } from "#contracts/types/comment-view.type";
export type { CommentableRef } from "#contracts/types/commentable-ref.type";
export type { DocumentReplica } from "#contracts/types/document-replica.type";
export type { DocumentSnapshot } from "#contracts/types/document-snapshot.type";
export type { MentionTarget } from "#contracts/types/mention-target.type";
export type { PresenceLink } from "#contracts/types/presence-link.type";
export type { PresenceLinkHandlers } from "#contracts/types/presence-link-handlers.type";
export type { PresencePeer } from "#contracts/types/presence-peer.type";
export type { SyncLink } from "#contracts/types/sync-link.type";
export type { SyncLinkHandlers } from "#contracts/types/sync-link-handlers.type";
