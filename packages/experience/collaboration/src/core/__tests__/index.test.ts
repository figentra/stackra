/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the configuration with its shipped schema, the entitlement, the
 *          session and the snapshot service are exported; the ports, the memory drivers, the Yjs binding and the
 *          internals are not.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as collaboration from "#core/index";

describe("@stackra/collaboration", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(collaboration).sort()).toEqual([
      "CollaborationConfig",
      "CollaborationConfig$",
      "CollaborationOptions",
      "CollaborationSession",
      "CommentCreated",
      "CommentTombstonedError",
      "CommentVisibilityNotAllowedError",
      "LiveCollaborationEntitlement",
      "MentionCreated",
      "MentionNotAllowedError",
      "RealtimePresenceChannelDriver",
      "RealtimeSyncTransportDriver",
      "SnapshotService",
      "checkMentions",
    ]);
  });

  it("keeps the ports, the drivers, the Yjs binding and the internals out of the entry", () => {
    for (const name of [
      "PresenceChannel",
      "SyncTransport",
      "SnapshotStore",
      "MemoryPresenceChannelDriver",
      "yjsReplica",
      "COLLABORATION_CONFIG_SCHEMA",
      "COMMENT_CREATED_SCHEMA",
      "MentionDirectory",
    ]) {
      expect(name in collaboration).toBe(false);
    }
  });
});
