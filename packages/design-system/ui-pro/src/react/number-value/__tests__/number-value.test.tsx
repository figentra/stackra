/**
 * Stackra file contract:
 * Purpose: proves the web NumberValue formats `value` through HeroUI Pro, keeps HeroUI Pro's `style` as the number
 *          style, passes unknown props through, draws the prefix and suffix, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and `@number-flow/react`; the animated digits are checked through the
 *          element's accessible text, not its drawn frames.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { NumberValue as HeroNumberValue } from "@heroui-pro/react/number-value";
import { render, screen } from "@testing-library/react";

import { NumberValue } from "#react/number-value/number-value";

describe("NumberValue (web)", () => {
  it("formats the value with the render prop, so the formatted string is checkable", () => {
    render(
      <NumberValue value={1234.5} locale="en-US" minimumFractionDigits={2}>
        {(formatted) => <span data-testid="out">{formatted}</span>}
      </NumberValue>,
    );
    expect(screen.getByTestId("out").textContent).toBe("1,234.50");
  });

  it("keeps HeroUI Pro's style name for the number style", () => {
    render(
      // oxlint-disable-next-line react/style-prop-object -- HeroUI Pro's `style` is the number style, a string
      <NumberValue value={0.5} style="percent" locale="en-US">
        {(formatted) => <span data-testid="out">{formatted}</span>}
      </NumberValue>,
    );
    expect(screen.getByTestId("out").textContent).toBe("50%");
  });

  it("draws the prefix and suffix and passes unknown props through", () => {
    render(
      <NumberValue value={7} data-testid="value" className="extra">
        <NumberValue.Prefix>~</NumberValue.Prefix>
        <NumberValue.Suffix>kg</NumberValue.Suffix>
      </NumberValue>,
    );
    const root = screen.getByTestId("value");
    expect(root.classList.contains("extra")).toBe(true);
    expect(screen.getByText("~")).toBeTruthy();
    expect(screen.getByText("kg")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(NumberValue.Prefix).toBe(HeroNumberValue.Prefix);
    expect(NumberValue.Suffix).toBe(HeroNumberValue.Suffix);
  });
});
