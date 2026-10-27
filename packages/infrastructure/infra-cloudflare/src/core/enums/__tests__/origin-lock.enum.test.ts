/**
 * Stackra file contract:
 * Purpose: unit tests of `OriginLock`: tunnel and mtls.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OriginLock } from "#core/enums/origin-lock.enum";

describe("OriginLock", () => {
  it("lists the two locks", () => {
    expect(Enum.values(OriginLock)).toEqual(["tunnel", "mtls"]);
    expectTypeOf<OriginLock>().toEqualTypeOf<"tunnel" | "mtls">();
  });
});
