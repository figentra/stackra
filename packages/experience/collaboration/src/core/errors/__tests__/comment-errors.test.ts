/**
 * Stackra file contract:
 * Purpose: unit tests of the three comment refusals: their codes and fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0433; ADR 0140.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import { MentionKind } from "#contracts/enums/mention-kind.enum";
import { CommentTombstonedError } from "#core/errors/comment-tombstoned.error";
import { CommentVisibilityNotAllowedError } from "#core/errors/comment-visibility-not-allowed.error";
import { MentionNotAllowedError } from "#core/errors/mention-not-allowed.error";

describe("comment refusals", () => {
  it("carry their codes and fields", () => {
    const commentId = "cmt_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"cmt">;
    expect(CommentTombstonedError.create({ commentId })).toMatchObject({
      code: "comment_tombstoned",
      commentId,
    });
    expect(MentionNotAllowedError.create({ mentionKind: MentionKind.Assistant })).toMatchObject({
      code: "mention_not_allowed",
      mentionKind: "assistant",
    });
    expect(
      CommentVisibilityNotAllowedError.create({ visibility: CommentVisibility.Shared }),
    ).toMatchObject({ code: "comment_visibility_not_allowed", visibility: "shared" });
  });
});
