/**
 * Stackra file contract:
 * Purpose: unit tests of `CommentVisibility`, `MentionKind` and `ThreadStatus`: their wire values.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0433 (decisions 1 to 3).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import { MentionKind } from "#contracts/enums/mention-kind.enum";
import { ThreadStatus } from "#contracts/enums/thread-status.enum";

describe("comment enums", () => {
  it("keep their wire values", () => {
    expect(Enum.values(CommentVisibility)).toEqual(["internal", "shared"]);
    expect(Enum.values(MentionKind)).toEqual([
      "member",
      "team",
      "role",
      "external_participant",
      "assistant",
    ]);
    expect(Enum.values(ThreadStatus)).toEqual(["open", "resolved"]);
  });
});
