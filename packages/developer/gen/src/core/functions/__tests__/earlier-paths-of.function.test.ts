/**
 * Stackra file contract:
 * Purpose: unit tests of `earlierPathsOf`: none for a field never renamed, the field's `@Renamed` name, and inside a
 *          section every pairing with the section's `@Renamed` name.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 22); STA-2056.
 */
import { describe, expect, it } from "@stackra/testing";

import { earlierPathsOf } from "#core/functions/earlier-paths-of.function";
import type { FieldIR } from "#core/types/field-ir.type";

/** A string field `name`, renamed from `renamed` when given. */
const field = (name: string, renamed?: string): FieldIR => ({
  name,
  optional: false,
  nullable: false,
  type: { kind: "string" },
  rules: [],
  ...(renamed === undefined ? {} : { renamed }),
});

describe("earlierPathsOf", () => {
  it("gives a top-level field its @Renamed name", () => {
    expect(earlierPathsOf(field("note"))).toEqual([]);
    expect(earlierPathsOf(field("memo", "note"))).toEqual(["note"]);
  });

  it("moves every inner path of a renamed section", () => {
    expect(earlierPathsOf(field("memo"), field("remarks"))).toEqual([]);
    expect(earlierPathsOf(field("memo", "note"), field("remarks"))).toEqual(["remarks.note"]);
    expect(earlierPathsOf(field("memo"), field("remarks", "notes"))).toEqual(["notes.memo"]);
    expect(earlierPathsOf(field("memo", "note"), field("remarks", "notes"))).toEqual([
      "remarks.note",
      "notes.memo",
      "notes.note",
    ]);
  });
});
