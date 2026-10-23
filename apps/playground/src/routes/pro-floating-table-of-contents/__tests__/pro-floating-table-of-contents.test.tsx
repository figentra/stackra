/**
 * Stackra file contract:
 * Purpose: proves the FloatingTableOfContents page sits at /pro-floating-table-of-contents in the Pro category, titles
 *          the page and the document, draws the article's four sections beside a named trigger, and, once the trigger
 *          is pressed, lists the four sections and moves the current one to the section chosen.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither, and `scrollIntoView` is stubbed since jsdom does no layout.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProFloatingTableOfContents } from "#src/routes/pro-floating-table-of-contents/pro-floating-table-of-contents";
import { ProFloatingTableOfContentsRoute } from "#src/routes/pro-floating-table-of-contents/pro-floating-table-of-contents.route";

describe("ProFloatingTableOfContents", () => {
  beforeEach(() => {
    stubBrowserApis();
    Element.prototype.scrollIntoView = () => {};
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-floating-table-of-contents in the Pro category, and titles the page and the document", () => {
    render(<ProFloatingTableOfContents />);
    expect(ProFloatingTableOfContentsRoute.path).toBe("/pro-floating-table-of-contents");
    expect(ProFloatingTableOfContentsRoute.category).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProFloatingTableOfContentsRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("FloatingTableOfContents · Stackra Playground");
  });

  it("draws the four sections beside a named trigger", () => {
    render(<ProFloatingTableOfContents />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4);
    expect(screen.getByLabelText("Table of contents")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Current section: Overview");
  });

  it("lists the sections once pressed, and moves the current one to the section chosen", () => {
    render(<ProFloatingTableOfContents />);
    fireEvent.click(screen.getByLabelText("Table of contents"));
    const items = screen.getAllByRole("button", {
      name: /^(Overview|Installation|Usage|Troubleshooting)$/,
    });
    expect(items).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Usage" }));
    expect(screen.getByRole("status").textContent).toBe("Current section: Usage");
  });
});
