/**
 * Stackra file contract:
 * Purpose: proves the single-column-layout page opens with the page's one `h1`, stacks three sections in one column,
 *          holds a scroll region for the child that is wider than the column, draws the Arabic layout in a right-to-left
 *          block, and that the live layout's buttons add and remove sections and the page reports the count.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so the width
 *           of the column and the scrolling are checked in the playground's e2e suite, not here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0022 (test placement).
 */
// @covers sta-350:FR-173
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { SingleColumnLayout } from "#src/routes/single-column-layout/single-column-layout";
import { SingleColumnLayoutRoute } from "#src/routes/single-column-layout/single-column-layout.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <SingleColumnLayout />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const sample = (name: string) => document.querySelector(`[data-sample='${name}']`) as HTMLElement;
const press = (element: HTMLElement) => act(() => element.click());

describe("Single column layout page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens with the page's one h1, and sits at /single-column-layout under Shell", () => {
    renderPage();
    expect(SingleColumnLayoutRoute.path).toBe("/single-column-layout");
    expect(SingleColumnLayoutRoute.category).toBe("Shell");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Single column layout" })).toBeTruthy();
    expect(document.title).toBe("Single column layout · Stackra Playground");
  });

  it("stacks three sections in one column, as level-3 headings", () => {
    renderPage();
    const stacked = within(sample("stacked"));
    expect(stacked.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Customer",
      "Payment",
      "Shipping",
    ]);
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
  });

  it("holds the wider child in a focusable, named scroll region", () => {
    renderPage();
    const scroller = within(sample("wide")).getByRole("group", { name: "Scrollable items" });
    expect(scroller.getAttribute("tabindex")).toBe("0");
    expect(scroller.className).toContain("overflow-x-auto");
  });

  it("draws the Arabic layout in a right-to-left block with Arabic text", () => {
    renderPage();
    const block = sample("arabic");
    expect(block.getAttribute("dir")).toBe("rtl");
    expect(within(block).getByRole("heading", { level: 3, name: "العميل" })).toBeTruthy();
  });

  it("adds and removes sections in the live layout and reports the count", () => {
    renderPage();
    const live = within(sample("live"));
    const status = sample("live-status");
    expect(live.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(status.textContent).toBe("2 sections.");

    press(screen.getByRole("button", { name: "Add a section" }));
    expect(live.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(status.textContent).toBe("3 sections.");

    press(screen.getByRole("button", { name: "Remove a section" }));
    press(screen.getByRole("button", { name: "Remove a section" }));
    press(screen.getByRole("button", { name: "Remove a section" }));
    expect(live.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    expect(status.textContent).toBe("0 sections.");
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Remove a section" }).disabled,
    ).toBe(true);
  });
});
