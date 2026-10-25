/**
 * Stackra file contract:
 * Purpose: unit tests of `CLAUDE_HOOK_EVENTS`: every neutral hook event has a Claude Code name, in `HookEvent` order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 9).
 */
import { Enum } from "@stackra/contracts";
import { HookEvent } from "@stackra/skills";
import { describe, expect, it } from "@stackra/testing";

import { CLAUDE_HOOK_EVENTS } from "#core/constants/claude-hook-events.constant";

describe("CLAUDE_HOOK_EVENTS", () => {
  it("maps every neutral event, in order", () => {
    expect(Object.keys(CLAUDE_HOOK_EVENTS)).toEqual(Enum.values(HookEvent));
    expect(Object.values(CLAUDE_HOOK_EVENTS)).toEqual([
      "SessionStart",
      "UserPromptSubmit",
      "PreToolUse",
      "PostToolUse",
    ]);
    expect(Object.isFrozen(CLAUDE_HOOK_EVENTS)).toBe(true);
  });
});
