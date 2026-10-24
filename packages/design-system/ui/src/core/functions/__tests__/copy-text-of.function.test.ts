/**
 * Stackra file contract:
 * Purpose: proves `copyTextOf` gives the copy value first, then a string or number value, and nothing for a row with
 *          no copy label, an empty label, an empty text, or a value that is not text.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-131
import { copyTextOf } from "#core/functions/copy-text-of.function";

describe("copyTextOf", () => {
  it("copies the copy value in preference to the shown value", () => {
    expect(copyTextOf({ value: "ord_01", copyLabel: "Copy", copyValue: "ord_01H2" })).toBe(
      "ord_01H2",
    );
  });

  it("copies a string value and a number value, zero included", () => {
    expect(copyTextOf({ value: "ada@example.com", copyLabel: "Copy" })).toBe("ada@example.com");
    expect(copyTextOf({ value: 42, copyLabel: "Copy" })).toBe("42");
    expect(copyTextOf({ value: 0, copyLabel: "Copy" })).toBe("0");
  });

  it("is not copyable without a name for the button", () => {
    expect(copyTextOf({ value: "ord_01" })).toBeUndefined();
    expect(copyTextOf({ value: "ord_01", copyLabel: "" })).toBeUndefined();
  });

  it("is not copyable when there is no text to copy", () => {
    expect(copyTextOf({ copyLabel: "Copy" })).toBeUndefined();
    expect(copyTextOf({ value: "", copyLabel: "Copy" })).toBeUndefined();
    expect(
      copyTextOf({ value: { type: "b", props: {}, key: null }, copyLabel: "Copy" }),
    ).toBeUndefined();
    expect(copyTextOf({ value: true, copyLabel: "Copy" })).toBeUndefined();
  });
});
