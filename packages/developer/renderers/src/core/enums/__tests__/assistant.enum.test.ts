/**
 * Stackra file contract:
 * Purpose: unit tests of `Assistant`: the five layouts ADR 0282 decision 2 names, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Assistant } from "#core/enums/assistant.enum";

describe("Assistant", () => {
  it("lists Claude Code, OpenCode, Kiro, Cursor and AGENTS.md", () => {
    expect(Enum.values(Assistant)).toEqual([
      "claude_code",
      "opencode",
      "kiro",
      "cursor",
      "agents_md",
    ]);
    expect(Assistant.ClaudeCode).toBe("claude_code");
    expectTypeOf<Assistant>().toEqualTypeOf<
      "claude_code" | "opencode" | "kiro" | "cursor" | "agents_md"
    >();
  });
});
