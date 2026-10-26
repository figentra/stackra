/**
 * Stackra file contract:
 * Purpose: unit tests of `CommentCreated` and `MentionCreated`: integration events with their names, built frozen from
 *          the shipped schemas; an assistant mention alone has no target id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0433 (decision 5); ADR 0141.
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import { MentionKind } from "#contracts/enums/mention-kind.enum";
import { COMMENT_CREATED_SCHEMA } from "#core/constants/comment-created-schema.constant";
import { MENTION_CREATED_SCHEMA } from "#core/constants/mention-created-schema.constant";
import { CommentCreated } from "#core/events/comment-created.event";
import { MentionCreated } from "#core/events/mention-created.event";

const base = {
  commentId: "cmt_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"cmt">,
  threadId: "cth_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"cth">,
  recordModel: "legal.matter",
  recordId: "mat_01j9z3k4m5n6p7q8r9s0t1v2w4",
  visibility: CommentVisibility.Internal,
};

describe("comment events", () => {
  it("CommentCreated is comment.created from its shipped schema", () => {
    expect(kindOf(CommentCreated)?.options).toMatchObject({ name: "comment.created", version: 1 });
    expect(schemaOf(CommentCreated)).toBe(COMMENT_CREATED_SCHEMA);
    const event = CommentCreated.create({ ...base, authorId: "usr_1" });
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("MentionCreated is mention.created and only the assistant has no target id", () => {
    expect(kindOf(MentionCreated)?.options).toMatchObject({ name: "mention.created", version: 1 });
    expect(schemaOf(MentionCreated)).toBe(MENTION_CREATED_SCHEMA);
    const values = { ...base, mentionedBy: "usr_1", kind: MentionKind.Assistant, targetId: null };
    expect(MentionCreated.create(values).targetId).toBeNull();
    expect(() => MentionCreated.create({ ...values, kind: MentionKind.Member })).toThrow();
  });
});
