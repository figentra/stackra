/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Realm`: an `Enum.of` whose codes, order and case names are the contract (ADR 0098; no tenant_admin realm).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { Realm } from "#core/enums/realm.enum";

describe("Realm", () => {
  it("holds exactly these codes, in this order", () => {
    expect(Enum.values(Realm)).toEqual(["platform", "tenant", "customer"]);
  });

  it("is a frozen Enum.of value whose case names are the PascalCase of the codes", () => {
    expect(Object.isFrozen(Realm)).toBe(true);
    // the type also names the type-only `~enum` map, which is never an own key at runtime
    for (const [caseName, code] of Object.entries(Realm) as [string, string][])
      expect(caseName.toLowerCase()).toBe(code.replaceAll("_", "").toLowerCase());
  });

  it("writes every code in snake_case", () => {
    for (const code of Enum.values(Realm)) expect(code).toMatch(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
  });

  it("has a type of the same name that refuses other strings", () => {
    const code: Realm = Realm.Customer;
    // @ts-expect-error -- not a code of Realm
    const wrong: Realm = "not_a_code";
    expect([code, wrong]).toEqual([Realm.Customer, "not_a_code"]);
  });
});
