/**
 * Stackra file contract:
 * Purpose: type tests of `ResolveOptions`: every field optional; statuses are pack statuses.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { PackStatus } from "#core/enums/pack-status.enum";
import type { ResolveOptions } from "#core/types/resolve-options.type";

describe("ResolveOptions", () => {
  it("has only optional fields", () => {
    expectTypeOf<Record<string, never>>().toExtend<ResolveOptions>();
    expectTypeOf<ResolveOptions["statuses"]>().toEqualTypeOf<readonly PackStatus[] | undefined>();
    expectTypeOf<ResolveOptions["pins"]>().toEqualTypeOf<
      Readonly<Record<string, string>> | undefined
    >();
  });
});
