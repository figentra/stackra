/**
 * Stackra file contract:
 * Purpose: unit tests of `OPENCODE_ACTIONS`: the writing, shell, web and sub-agent tools map onto OpenCode actions;
 *          read-only tools are absent.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0286 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { OPENCODE_ACTIONS } from "#core/constants/opencode-actions.constant";

describe("OPENCODE_ACTIONS", () => {
  it("maps tools onto OpenCode permission actions", () => {
    expect(new Set(Object.values(OPENCODE_ACTIONS))).toEqual(
      new Set(["edit", "shell", "webfetch", "websearch", "subagent"]),
    );
    expect(OPENCODE_ACTIONS["Edit"]).toBe("edit");
    expect(OPENCODE_ACTIONS["Read"]).toBeUndefined();
    expect(Object.isFrozen(OPENCODE_ACTIONS)).toBe(true);
  });
});
