/**
 * Stackra file contract:
 * Purpose: type tests of the `SettingRevisionStore` port: its key and its five methods' parameters.
 * Boundary: test only; the memory driver's behaviour is tested beside it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 5); ADR 0263.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingRevisionStore } from "#contracts/ports/setting-revision-store.port";
import type { SettingRevision, SettingTarget } from "#contracts/index";

describe("SettingRevisionStore", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(SettingRevisionStore)).toBe(Port);
  });

  it("types its methods", () => {
    expectTypeOf<SettingRevisionStore["append"]>().parameters.toEqualTypeOf<
      [Omit<SettingRevision, "id">]
    >();
    expectTypeOf<
      SettingRevisionStore["find"]
    >().returns.resolves.toEqualTypeOf<SettingRevision | null>();
    expectTypeOf<SettingRevisionStore["list"]>().parameters.toEqualTypeOf<
      [string, SettingTarget]
    >();
    expectTypeOf<SettingRevisionStore["due"]>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<SettingRevisionStore["~key"]>().toEqualTypeOf<"settings.SettingRevisionStore">();
  });
});
