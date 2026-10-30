/**
 * Stackra file contract:
 * Purpose: proves the web Sparkline: an image whose name speaks its label and every figure in the locale (an Arabic
 *          comma in Arabic), drawn as a line by default, or as an area or bars on request.
 * Boundary: jsdom; the chart's box is given a size through a ResizeObserver stand-in so Recharts draws its SVG.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { Sparkline } from "#react/sparkline/sparkline";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ target, contentRect: { width: 600, height: 240 } } as unknown as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }

      unobserve() {}

      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 600,
    height: 240,
    top: 0,
    left: 0,
    right: 600,
    bottom: 240,
    x: 0,
    y: 0,
  } as DOMRect);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Sparkline (web)", () => {
  it("speaks every figure in its name and draws a line by default", () => {
    const { container } = render(<Sparkline data={[1200, 30, 4]} label="Sales" />);
    expect(screen.getByRole("img", { name: "Sales: 1,200, 30, 4" })).toBeTruthy();
    expect(container.querySelector(".recharts-line")).not.toBeNull();
  });

  it("draws an area or bars on request and speaks Arabic with an Arabic comma", () => {
    const { container, rerender } = render(
      <I18nProvider locale="ar-u-nu-arab">
        <Sparkline data={[1, 2]} label="Sales" kind="area" color="success" valueFormat={{}} />
      </I18nProvider>,
    );
    expect(screen.getByRole("img", { name: "Sales: ١، ٢" })).toBeTruthy();
    expect(container.querySelector(".recharts-area")).not.toBeNull();
    rerender(<Sparkline data={[1, 2]} label="Sales" kind="bar" height={20} />);
    expect(container.querySelector(".recharts-bar")).not.toBeNull();
  });
});
