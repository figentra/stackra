/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Tone`: an `Enum.of` whose codes, order and case names are the contract (ADR 0303 decision 7; no info).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { Tone } from "#core/enums/tone.enum";

describe("Tone", () => {
  it("holds exactly these codes, in this order", () => {
    expect(Enum.values(Tone)).toEqual(["default", "accent", "success", "warning", "danger"]);
  });

  it("is a frozen Enum.of value whose case names are the PascalCase of the codes", () => {
    expect(Object.isFrozen(Tone)).toBe(true);
    // the type also names the type-only `~enum` map, which is never an own key at runtime
    for (const [caseName, code] of Object.entries(Tone) as [string, string][])
      expect(caseName.toLowerCase()).toBe(code.replaceAll("_", "").toLowerCase());
  });

  it("writes every code in snake_case", () => {
    for (const code of Enum.values(Tone)) expect(code).toMatch(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
  });

  it("has a type of the same name that refuses other strings", () => {
    const code: Tone = Tone.Accent;
    // @ts-expect-error -- not a code of Tone
    const wrong: Tone = "not_a_code";
    expect([code, wrong]).toEqual([Tone.Accent, "not_a_code"]);
  });
});
