/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the snapshot store driver, the comment models and service, and
 *          the room publish action with its input and the room permissions are its only values.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/collaboration/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "Comment",
      "CommentMention",
      "CommentRevision",
      "CommentService",
      "CommentThread",
      "PostgresSnapshotStoreDriver",
      "RoomPermissions",
      "RoomPublishAction",
      "RoomPublishInput",
    ]);
  });
});
