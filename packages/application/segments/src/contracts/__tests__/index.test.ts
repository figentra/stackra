/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `SegmentKind` is its one value, and the `SegmentRef`,
 *          `SubjectRef` and `SegmentSubject` types have the shapes consumers store and implement.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15); ADR 0332.
 */
import type { PublicId } from "@stackra/contracts";
import type { RuleFacts, Rules } from "@stackra/rules";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { SegmentRef, SegmentSubject, SubjectRef } from "#contracts/index";

describe("@stackra/segments/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["SegmentKind"]);
  });

  it("types a segment audience, a subject and a subject source", () => {
    expectTypeOf<SegmentRef>().toEqualTypeOf<{
      readonly kind: "segment";
      readonly id: PublicId<"seg">;
    }>();
    expectTypeOf<SubjectRef>().toEqualTypeOf<{ readonly model: string; readonly id: string }>();
    expectTypeOf<SegmentSubject["rules"]>().toEqualTypeOf<Rules>();
    expectTypeOf<SegmentSubject["ids"]>().toEqualTypeOf<
      (after: string | null, limit: number) => Promise<readonly string[]>
    >();
    expectTypeOf<SegmentSubject["facts"]>().toEqualTypeOf<
      (ids: readonly string[]) => Promise<ReadonlyMap<string, RuleFacts>>
    >();
  });
});
