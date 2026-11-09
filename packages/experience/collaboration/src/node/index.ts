/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/collaboration (the Postgres snapshot store, the comment,
 *          thread, revision and mention models, the `CommentService`, the room host: the `collaboration.room.token`
 *          and `collaboration.room.publish` actions with their shapes, `RoomController` at the room path, the
 *          `@Collaborative` model facet and the root `CollaborationModule`, and `RoomPermissions`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: the driver reaches Postgres through
 *           @stackra/database. The migrations are found by their path, as every migration is, so they are not
 *           re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { RoomMemberRole } from "#node/access/room-member.role";
export { RoomPermissions } from "#node/access/room.permissions";
export { RoomPublishAction } from "#node/actions/room-publish.action";
export { RoomTokenAction } from "#node/actions/room-token.action";
export { CollaborationModule } from "#node/collaboration.module";
export { Collaborative } from "#node/decorators/collaborative.decorator";
export { PostgresSnapshotStoreDriver } from "#node/drivers/postgres-snapshot-store.driver";
export { Comment } from "#node/models/comment.model";
export { CommentMention } from "#node/models/comment-mention.model";
export { CommentRevision } from "#node/models/comment-revision.model";
export { CommentThread } from "#node/models/comment-thread.model";
export { RoomController } from "#node/raw/room.controller";
export { RoomPublishInput } from "#node/schemas/room-publish-input.schema";
export { RoomTokenInput } from "#node/schemas/room-token-input.schema";
export { RoomTokenOutput } from "#node/schemas/room-token-output.schema";
export { CommentService } from "#node/services/comment.service";
// The entity list gen writes for the module, which a hosting service registers (STA-1793).
export { COLLABORATION_ENTITIES } from "#node/entities.gen";
export type { CollaborativeOptions } from "#node/types/collaborative-options.type";
