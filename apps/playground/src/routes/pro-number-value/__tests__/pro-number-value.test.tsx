/**
 * Stackra file contract:
 * Purpose: proves the NumberValue page sits at /pro-number-value in the Pro category, titles the page and the document,
 *          formats the amount in four currencies and four compact figures, and keeps every `dt` and `dd` inside a
 *          `dl`.
 * Boundary: jsdom with real HeroUI Pro; `matchMedia` and `ResizeObserver` are stubbed because jsdom has neither.
 *           NumberFlow, which draws the rolling number (ADR 0329), puts its digits in a shadow root that `textContent`
 *           does not reach, so it is replaced by a stand-in that formats with the same locale and options.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0329 (motion layer); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProNumberValue } from "#src/routes/pro-number-value/pro-number-value";
import { ProNumberValueRoute } from "#src/routes/pro-number-value/pro-number-value.route";

vi.mock("@number-flow/react", () => ({
  default: (props: {
    value: number;
    locales?: Intl.LocalesArgument;
    format?: Intl.NumberFormatOptions;
  }) => <span>{new Intl.NumberFormat(props.locales, props.format).format(props.value)}</span>,
}));

describe("ProNumberValue", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-number-value in the Pro category, and titles the page and the document", () => {
    render(<ProNumberValue />);
    expect(ProNumberValueRoute.path).toBe("/pro-number-value");
    expect(ProNumberValueRoute.category).toBe("Feedback and status");
    expect(screen.getByRole("heading", { level: 1, name: ProNumberValueRoute.title })).toBeTruthy();
    expect(document.title).toBe("NumberValue · Stackra Playground");
  });

  it("formats the amount in four currencies", () => {
    render(<ProNumberValue />);
    const text = document.body.textContent ?? "";
    for (const amount of ["$228,441.00", "€228,441.00", "¥228,441", "£228,441.00"])
      expect(text).toContain(amount);
  });

  it("formats four compact figures, and keeps every dt and dd inside a dl", () => {
    render(<ProNumberValue />);
    const text = document.body.textContent ?? "";
    for (const figure of ["1.2K", "46K", "1.2M", "9.9B"]) expect(text).toContain(figure);
    for (const term of document.querySelectorAll("dt, dd")) expect(term.closest("dl")).toBeTruthy();
  });
});
