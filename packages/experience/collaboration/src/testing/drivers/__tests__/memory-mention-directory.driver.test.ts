/**
 * Stackra file contract:
 * Purpose: unit test of `MemoryMentionDirectoryDriver`: only the targets it was given are known.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0433 (decision 3).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MentionDirectory, MentionKind } from "#contracts/index";
import { MemoryMentionDirectoryDriver } from "#testing/drivers/memory-mention-directory.driver";

describe(MemoryMentionDirectoryDriver, () => {
  it("knows only the targets it was given", async () => {
    const known = { kind: MentionKind.Member, id: "usr_1" };
    const stranger = { kind: MentionKind.Member, id: "usr_2" };
    const directory = MemoryMentionDirectoryDriver.of([known]);
    expect(directory).toBeInstanceOf(MentionDirectory);
    await expect(
      directory.unknownAmong(
        { id: "scp_1" as PublicId<"scp">, path: "platform" },
        { model: "legal.matter", id: "mat_1" },
        [known, stranger],
      ),
    ).resolves.toEqual([stranger]);
  });
});
