/**
 * Stackra file contract:
 * Purpose: proves the web SingleColumnLayout stacks its children in a flex column with a gap and no landmark or
 *          heading of its own, merges a caller's class, and passes every `div` prop through.
 * Boundary: jsdom; the theme CSS is not loaded, so classes and attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-171
import { render, screen } from "@testing-library/react";

import { SingleColumnLayout } from "#react/single-column-layout/single-column-layout";

describe("SingleColumnLayout (web)", () => {
  it("stacks its children in order in one flex column with a gap", () => {
    render(
      <SingleColumnLayout data-testid="layout">
        <p>One</p>
        <p>Two</p>
      </SingleColumnLayout>,
    );
    const layout = screen.getByTestId("layout");
    expect(layout.tagName).toBe("DIV");
    expect(layout.className).toContain("flex-col");
    expect(layout.className).toContain("gap-3");
    expect([...layout.children].map((child) => child.textContent)).toEqual(["One", "Two"]);
  });

  it("draws no landmark and no heading", () => {
    const { container } = render(
      <SingleColumnLayout>
        <p>One</p>
      </SingleColumnLayout>,
    );
    expect(container.querySelector("main, aside, section, header, nav, h1, h2, h3")).toBeNull();
  });

  it("merges a caller's class and passes other props through", () => {
    render(
      <SingleColumnLayout data-testid="layout" id="page" className="max-w-3xl" aria-busy="true" />,
    );
    const layout = screen.getByTestId("layout");
    expect(layout.id).toBe("page");
    expect(layout.className).toContain("max-w-3xl");
    expect(layout.className).toContain("flex-col");
    expect(layout.getAttribute("aria-busy")).toBe("true");
  });
});
