/**
 * Stackra file contract:
 * Purpose: proves `splitTags` splits on Latin and Arabic commas, semicolons and line breaks without touching the
 *          letters, and `addTags` keeps order, refuses duplicates (ignoring case), the caller's invalid tags and tags
 *          past the maximum, each with its reason.
 * Boundary: pure functions.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { addTags } from "#core/functions/add-tags.function";
import { splitTags } from "#core/functions/split-tags.function";

describe("splitTags", () => {
  it("splits on commas, the Arabic comma, semicolons and line breaks", () => {
    expect(splitTags("vip, wholesale\nriyadh ;  ،الرياض، جدة\r\n")).toEqual([
      "vip",
      "wholesale",
      "riyadh",
      "الرياض",
      "جدة",
    ]);
  });
});

describe("addTags", () => {
  it("adds in order and refuses duplicates, invalid tags and tags past the maximum", () => {
    const result = addTags(["VIP"], ["vip", "bad tag", "gold", "silver", "bronze"], {
      max: 3,
      validate: (tag) => (tag.includes(" ") ? "No spaces" : undefined),
    });
    expect(result.tags).toEqual(["VIP", "gold", "silver"]);
    expect(result.rejected).toEqual([
      { tag: "vip", reason: "duplicate" },
      { tag: "bad tag", reason: "invalid", message: "No spaces" },
      { tag: "bronze", reason: "max" },
    ]);
  });

  it("keeps duplicates when allowed", () => {
    expect(addTags(["a"], ["a"], { allowDuplicates: true }).tags).toEqual(["a", "a"]);
  });
});
