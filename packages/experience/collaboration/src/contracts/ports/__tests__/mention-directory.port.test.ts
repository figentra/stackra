/**
 * Stackra file contract:
 * Purpose: unit test of `MentionDirectory`: an abstract port a driver extends.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0433 (decision 3).
 */
import { Port, type PublicId, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MentionKind } from "#contracts/enums/mention-kind.enum";
import { MentionDirectory } from "#contracts/ports/mention-directory.port";
import type { CommentableRef } from "#contracts/types/commentable-ref.type";
import type { MentionTarget } from "#contracts/types/mention-target.type";

describe("MentionDirectory", () => {
  it("is a port a directory driver implements", async () => {
    class NoOne extends MentionDirectory {
      unknownAmong(
        _scope: ScopeRef,
        _record: CommentableRef,
        targets: readonly MentionTarget[],
      ): Promise<readonly MentionTarget[]> {
        return Promise.resolve(targets);
      }
    }
    const directory = new NoOne();
    expect(directory).toBeInstanceOf(Port);
    const target = { kind: MentionKind.Member, id: "usr_1" };
    await expect(
      directory.unknownAmong(
        { id: "scp_1" as PublicId<"scp">, path: "platform" },
        { model: "a.b", id: "x" },
        [target],
      ),
    ).resolves.toEqual([target]);
  });
});
