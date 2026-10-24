/**
 * Stackra file contract:
 * Purpose: proves `TWO_COLUMN_LAYOUT_CLASS_NAME` has a grid for exactly the layout breakpoints, that each one is a
 *          single column until its own breakpoint and two columns (a shrinkable main column and a 20 rem side column)
 *          from it up, and that no class names a physical side, so right-to-left mirrors by itself.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 6); ADR 0060 (right-to-left); ADR 0022 (test placement).
 */
// @covers sta-350:FR-172
import { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import { TWO_COLUMN_LAYOUT_CLASS_NAME } from "#core/constants/two-column-layout-class-name.constant";

/** Classes that name a physical side or direction instead of the start and end. */
const PHYSICAL = /(^|\s)(-?(ml|mr|pl|pr|left|right)-|text-(left|right)|rounded-(l|r|tl|tr|bl|br)-)/;

describe("TWO_COLUMN_LAYOUT_CLASS_NAME", () => {
  it("has a grid for exactly the breakpoints of the contract", () => {
    expect(Object.keys(TWO_COLUMN_LAYOUT_CLASS_NAME).sort()).toEqual([...LayoutBreakpoint].sort());
  });

  it.each(LayoutBreakpoint)("is one column until %s and two columns from it up", (breakpoint) => {
    const classes = TWO_COLUMN_LAYOUT_CLASS_NAME[breakpoint].split(" ");
    expect(classes).toContain("grid-cols-1");
    expect(classes).toContain(`${breakpoint}:grid-cols-[minmax(0,1fr)_20rem]`);
    // No other breakpoint's class: the collapse point is the one the caller named.
    const others = classes.filter(
      (name) => name.includes(":") && !name.startsWith(`${breakpoint}:`),
    );
    expect(others).toEqual([]);
  });

  it("names no physical side", () => {
    for (const classes of Object.values(TWO_COLUMN_LAYOUT_CLASS_NAME)) {
      expect(classes).not.toMatch(PHYSICAL);
    }
  });
});
