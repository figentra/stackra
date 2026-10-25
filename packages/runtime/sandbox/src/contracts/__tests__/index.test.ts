/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `SandboxFetchProxy` is the only value, and the request and
 *          response types resolve to their fields.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { SandboxFetchRequest, SandboxFetchResponse } from "#contracts/index";

describe("@stackra/sandbox/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["SandboxFetchProxy"]);
  });

  it("resolves the request and response types", () => {
    expectTypeOf<SandboxFetchRequest["url"]>().toEqualTypeOf<string>();
    expectTypeOf<SandboxFetchRequest["method"]>().toEqualTypeOf<string>();
    expectTypeOf<SandboxFetchRequest["headers"]>().toEqualTypeOf<
      Readonly<Record<string, string>>
    >();
    expectTypeOf<SandboxFetchRequest["body"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<SandboxFetchResponse["status"]>().toEqualTypeOf<number>();
    expectTypeOf<SandboxFetchResponse["body"]>().toEqualTypeOf<string>();
  });
});
