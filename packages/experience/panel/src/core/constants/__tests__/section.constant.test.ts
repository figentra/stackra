/**
 * Stackra file contract:
 * Purpose: unit tests of `Section.of`: a frozen section node holding its entries and the aside flag.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { Entry } from "#core/constants/entry.constant";
import { Section } from "#core/constants/section.constant";

describe("Section", () => {
  it("builds a frozen section node", () => {
    const section = Section.of("totals", [Entry.from("total")], { aside: true });
    expect(section).toEqual({
      kind: "section",
      name: "totals",
      entries: [{ kind: "value", key: "total" }],
      aside: true,
    });
    expect(Object.isFrozen(section)).toBe(true);
  });
});
