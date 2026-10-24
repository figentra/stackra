/**
 * Stackra file contract:
 * Purpose: proves `pageActionVariant` gives the primary action `primary` and the others `secondary`, and a danger
 *          action `danger` or `danger-soft` by its role; any other tone reads as default.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 1); ADR 0022 (test placement).
 */
// @covers sta-350:FR-163
import { pageActionVariant } from "#core/functions/page-action-variant.function";

describe("pageActionVariant", () => {
  it("draws the first action as primary and the others as secondary", () => {
    const action = { id: "edit", label: "Edit" };
    expect(pageActionVariant(action, true)).toBe("primary");
    expect(pageActionVariant(action, false)).toBe("secondary");
  });

  it("draws a danger action in the danger colours, solid when primary", () => {
    const action = { id: "delete", label: "Delete", tone: "danger" } as const;
    expect(pageActionVariant(action, true)).toBe("danger");
    expect(pageActionVariant(action, false)).toBe("danger-soft");
  });

  it("reads the default tone like no tone", () => {
    expect(pageActionVariant({ id: "a", label: "A", tone: "default" }, true)).toBe("primary");
  });
});
