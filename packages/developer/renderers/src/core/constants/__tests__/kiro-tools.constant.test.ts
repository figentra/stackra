/**
 * Stackra file contract:
 * Purpose: unit tests of `KIRO_TOOLS`: every mapped name is a Kiro tool, and `Skill` is dropped on purpose.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0286 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { KIRO_TOOLS } from "#core/constants/kiro-tools.constant";

describe("KIRO_TOOLS", () => {
  it("maps neutral tools onto Kiro's tool set", () => {
    expect(new Set(Object.values(KIRO_TOOLS).filter((tool) => tool !== null))).toEqual(
      new Set(["read", "write", "shell", "web", "todo_list", "subagent"]),
    );
    expect(KIRO_TOOLS["Bash"]).toBe("shell");
    expect(KIRO_TOOLS["Skill"]).toBeNull();
    expect(Object.isFrozen(KIRO_TOOLS)).toBe(true);
  });
});
