/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: only `loadSkillSet` is exported, and none of `.`'s symbols.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15: one symbol, one entry).
 */
import { describe, expect, it } from "@stackra/testing";

import * as skillsNode from "#node/index";

describe("@stackra/skills/node", () => {
  it("exports exactly loadSkillSet", () => {
    expect(Object.keys(skillsNode)).toEqual(["loadSkillSet"]);
  });
});
