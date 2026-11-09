/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSkillTech`: a skill that teaches a rejected technology is one finding, naming the
 *          skill and the technology; a reasoned allowance covers it; a code form is matched, not the English word.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0227; ADR 0258 (decision 6); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkSkillTech } from "#node/functions/check-skill-tech.function";

describe("checkSkillTech", () => {
  it("finds a rejected technology a skill teaches, and lets an allowed one through", () => {
    expect(
      checkSkillTech(
        new Map([
          ["orm-guide", "Set up `drizzle-kit` and run migrations."],
          ["tdd", "Jest-style `describe` blocks."],
          ["writing", "Express your intent clearly."],
        ]),
      ),
    ).toEqual([
      ".agents/skills/orm-guide: teaches 'drizzle', which is rejected (ADR 0227); fence it, drop it, or add a reasoned SKILL_TECH_ALLOWED entry (ADR 0258)",
    ]);
  });
});
