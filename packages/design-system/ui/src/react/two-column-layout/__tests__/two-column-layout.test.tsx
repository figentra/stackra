/**
 * Stackra file contract:
 * Purpose: proves the web TwoColumnLayout draws the main column first and the side column second in the document
 *          (so reading and tab order never depend on width), collapses at `lg` by default and at the breakpoint it is
 *          given, with that breakpoint's static classes and no other, draws no landmark, merges a caller's class and
 *          passes `div` props through, and that the type requires `aside` and refuses an unknown breakpoint.
 * Boundary: jsdom; the theme CSS is not loaded, so classes and attributes are checked, not looks. The mirroring in
 *           right-to-left and the stacking at a narrow width are layout, checked in the playground's e2e suite.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decisions 1 and 6); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-172
import { render, screen } from "@testing-library/react";

import { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import { TwoColumnLayout } from "#react/two-column-layout/two-column-layout";
import type { TwoColumnLayoutProps } from "#react/two-column-layout/two-column-layout.props";

describe("TwoColumnLayout (web)", () => {
  it("draws the main column first and the side column second", () => {
    render(
      <TwoColumnLayout data-testid="layout" aside={<p>Side</p>}>
        <p>Main</p>
      </TwoColumnLayout>,
    );
    const [main, side] = [...screen.getByTestId("layout").children];
    expect(main?.getAttribute("data-slot")).toBe("two-column-main");
    expect(main?.textContent).toBe("Main");
    expect(side?.getAttribute("data-slot")).toBe("two-column-aside");
    expect(side?.textContent).toBe("Side");
  });

  it("collapses at lg unless told otherwise", () => {
    render(<TwoColumnLayout data-testid="layout" aside="Side" />);
    const classes = screen.getByTestId("layout").className.split(" ");
    expect(classes).toContain("grid-cols-1");
    expect(classes).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
  });

  it.each(LayoutBreakpoint)(
    "collapses at %s when told to, with that breakpoint's class only",
    (collapseBelow) => {
      render(<TwoColumnLayout data-testid="layout" aside="Side" collapseBelow={collapseBelow} />);
      const classes = screen.getByTestId("layout").className.split(" ");
      expect(classes).toContain(`${collapseBelow}:grid-cols-[minmax(0,1fr)_20rem]`);
      expect(classes.filter((name) => name.includes(":"))).toHaveLength(1);
    },
  );

  it("draws no landmark: both columns are plain blocks that can shrink", () => {
    const { container } = render(<TwoColumnLayout aside={<p>Side</p>} />);
    expect(container.querySelector("main, aside, section, header, nav")).toBeNull();
    for (const column of container.querySelectorAll("[data-slot^='two-column-']")) {
      expect(column.tagName).toBe("DIV");
      expect(column.className).toContain("min-w-0");
    }
  });

  it("merges a caller's class and passes other props through", () => {
    render(
      <TwoColumnLayout
        data-testid="layout"
        aside="Side"
        id="page"
        className="mt-4"
        aria-busy="true"
      />,
    );
    const layout = screen.getByTestId("layout");
    expect(layout.id).toBe("page");
    expect(layout.className).toContain("mt-4");
    expect(layout.className).toContain("grid");
    expect(layout.getAttribute("aria-busy")).toBe("true");
  });

  it("requires a side column and refuses an unknown breakpoint at the type level", () => {
    // @ts-expect-error: the side column is required
    const lonely: TwoColumnLayoutProps = {};
    // @ts-expect-error: a breakpoint is a name, not a width
    const odd: TwoColumnLayoutProps = { aside: "Side", collapseBelow: "900px" };
    expect([lonely, odd]).toHaveLength(2);
  });
});
