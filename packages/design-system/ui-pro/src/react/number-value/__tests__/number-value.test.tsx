/**
 * Stackra file contract:
 * Purpose: proves the web NumberValue formats `value` through HeroUI Pro, keeps HeroUI Pro's `style` as the number
 *          style, passes unknown props through, draws the prefix and suffix, carries HeroUI Pro's own parts, and rolls
 *          the number with NumberFlow on the theme's reveal step unless `isAnimated` is off, a render prop is given or
 *          the notation is one NumberFlow cannot draw.
 * Boundary: jsdom with real HeroUI Pro; `@number-flow/react` is replaced by a recording stand-in, so what reaches
 *           NumberFlow is checked, not its drawn frames.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
// @covers sta-430:FR-007
import { NumberValue as HeroNumberValue } from "@heroui-pro/react/number-value";
import { render, screen } from "@testing-library/react";

import { NumberValue } from "#react/number-value/number-value";

const flow = vi.hoisted(() => ({ props: undefined as Record<string, unknown> | undefined }));

vi.mock("@number-flow/react", () => ({
  default: (props: Record<string, unknown>) => {
    flow.props = props;
    return <span data-slot="number-flow">{String(props["value"])}</span>;
  },
}));

beforeEach(() => {
  flow.props = undefined;
});

describe("NumberValue (web)", () => {
  it("formats the value with the render prop, so the formatted string is checkable", () => {
    render(
      <NumberValue value={1234.5} locale="en-US" minimumFractionDigits={2}>
        {(formatted) => <span data-testid="out">{formatted}</span>}
      </NumberValue>,
    );
    expect(screen.getByTestId("out").textContent).toBe("1,234.50");
    expect(flow.props).toBeUndefined();
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

  it("rolls the number with NumberFlow on the reveal step, with the locale and number format", () => {
    // oxlint-disable-next-line react/style-prop-object -- HeroUI Pro's `style` is the number style, a string
    render(<NumberValue value={42} locale="ar-SA" style="currency" currency="SAR" />);
    expect(flow.props).toMatchObject({
      value: 42,
      locales: "ar-SA",
      format: { style: "currency", currency: "SAR" },
      className: "number-value__value",
      transformTiming: { duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      spinTiming: { duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    });
  });

  it("draws the prefix and suffix around the number and passes unknown props through", () => {
    render(
      <NumberValue value={7} data-testid="value" className="extra">
        <NumberValue.Prefix>~</NumberValue.Prefix>
        <NumberValue.Suffix>kg</NumberValue.Suffix>
      </NumberValue>,
    );
    const root = screen.getByTestId("value");
    expect(root.classList.contains("number-value")).toBe(true);
    expect(root.classList.contains("extra")).toBe(true);
    expect(root.textContent).toBe("~7kg");
  });

  it("draws HeroUI Pro's still number when isAnimated is off or the notation is scientific", () => {
    const { rerender } = render(<NumberValue value={7} isAnimated={false} locale="en-US" />);
    expect(flow.props).toBeUndefined();
    expect(document.querySelector('[data-slot="number-value-value"]')?.textContent).toBe("7");
    rerender(<NumberValue value={1200} notation="scientific" locale="en-US" />);
    expect(flow.props).toBeUndefined();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(NumberValue.Prefix).toBe(HeroNumberValue.Prefix);
    expect(NumberValue.Suffix).toBe(HeroNumberValue.Suffix);
  });
});
