/**
 * Stackra file contract:
 * Purpose: unit and type tests of `HttpMethod`: an `Enum.of` whose codes, order and case names are the contract (HTTP's own tokens, as the manifest writes them).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { HttpMethod } from "#core/enums/http-method.enum";

describe("HttpMethod", () => {
  it("holds exactly these codes, in this order", () => {
    expect(Enum.values(HttpMethod)).toEqual(["GET", "POST", "PUT", "PATCH", "DELETE"]);
  });

  it("is a frozen Enum.of value whose case names are the PascalCase of the codes", () => {
    expect(Object.isFrozen(HttpMethod)).toBe(true);
    // the type also names the type-only `~enum` map, which is never an own key at runtime
    for (const [caseName, code] of Object.entries(HttpMethod) as [string, string][])
      expect(caseName.toLowerCase()).toBe(code.replaceAll("_", "").toLowerCase());
  });

  it("keeps HTTP's upper-case spelling, the tool-owned exception to snake_case", () => {
    for (const code of Enum.values(HttpMethod)) expect(code).toMatch(/^[A-Z]+$/);
  });

  it("has a type of the same name that refuses other strings", () => {
    const code: HttpMethod = HttpMethod.Put;
    // @ts-expect-error -- not a code of HttpMethod
    const wrong: HttpMethod = "not_a_code";
    expect([code, wrong]).toEqual([HttpMethod.Put, "not_a_code"]);
  });
});
