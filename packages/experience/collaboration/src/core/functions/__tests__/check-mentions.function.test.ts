/**
 * Stackra file contract:
 * Purpose: unit tests of `checkMentions`: duplicates collapse, the assistant loses any id, and each floor refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0433 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import { MentionKind } from "#contracts/enums/mention-kind.enum";
import { MentionNotAllowedError } from "#core/errors/mention-not-allowed.error";
import { checkMentions } from "#core/functions/check-mentions.function";

const RULES = { sharedComments: true, assistantHandle: "Tamo" };

describe(checkMentions, () => {
  it("keeps each target once and drops the assistant's id", () => {
    expect(
      checkMentions(
        CommentVisibility.Shared,
        [
          { kind: MentionKind.Member, id: "usr_1" },
          { kind: MentionKind.Member, id: "usr_1" },
          { kind: MentionKind.Assistant, id: "x" },
          { kind: MentionKind.ExternalParticipant, id: "prt_1" },
        ],
        RULES,
      ),
    ).toEqual([
      { kind: "member", id: "usr_1" },
      { kind: "assistant", id: null },
      { kind: "external_participant", id: "prt_1" },
    ]);
  });

  it("refuses what the floors forbid", () => {
    const internal = CommentVisibility.Internal;
    expect(() =>
      checkMentions(internal, [{ kind: MentionKind.ExternalParticipant, id: "prt_1" }], RULES),
    ).toThrow(MentionNotAllowedError);
    expect(() =>
      checkMentions(internal, [{ kind: MentionKind.Assistant, id: null }], {
        ...RULES,
        assistantHandle: null,
      }),
    ).toThrow(MentionNotAllowedError);
    expect(() => checkMentions(internal, [{ kind: MentionKind.Team, id: null }], RULES)).toThrow(
      MentionNotAllowedError,
    );
  });
});
