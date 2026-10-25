/**
 * Stackra file contract:
 * Purpose: proves the two-column-layout page opens with the page's one `h1`, draws the default layout with its two
 *          columns in reading order, the layouts that collapse at `md` and `xl` with their own breakpoint's class, the
 *          Arabic layout in a right-to-left block, and that the live layout's switch adds a history section to the side
 *          column and the page reports it.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so the
 *           stacking at a narrow width and the mirroring in right-to-left are checked in the playground's e2e suite, not
 *           here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0022 (test placement).
 */
// @covers sta-350:FR-173
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { TwoColumnLayout } from "#src/routes/two-column-layout/two-column-layout";
import { TwoColumnLayoutRoute } from "#src/routes/two-column-layout/two-column-layout.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <TwoColumnLayout />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const sample = (name: string) => document.querySelector(`[data-sample='${name}']`) as HTMLElement;
const column = (name: string, slot: "main" | "aside") =>
  within(sample(name).querySelector(`[data-slot='two-column-${slot}']`) as HTMLElement);

describe("Two column layout page", () => {
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

  it("opens with the page's one h1, and sits at /two-column-layout under Layout", () => {
    renderPage();
    expect(TwoColumnLayoutRoute.path).toBe("/two-column-layout");
    expect(TwoColumnLayoutRoute.category).toBe("Layout");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Two column layout" })).toBeTruthy();
    expect(document.title).toBe("Two column layout · Stackra Playground");
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
  });

  it("draws the default layout with the order and items in the main column, the summary and history beside", () => {
    renderPage();
    expect(
      column("default", "main")
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Order", "Items"]);
    expect(
      column("default", "aside")
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Summary", "History"]);
    expect(sample("default").firstElementChild?.className).toContain(
      "lg:grid-cols-[minmax(0,1fr)_20rem]",
    );
  });

  it("collapses the two other layouts at md and at xl", () => {
    renderPage();
    expect(sample("md").firstElementChild?.className).toContain(
      "md:grid-cols-[minmax(0,1fr)_20rem]",
    );
    expect(sample("xl").firstElementChild?.className).toContain(
      "xl:grid-cols-[minmax(0,1fr)_20rem]",
    );
  });

  it("draws the Arabic layout in a right-to-left block with Arabic text", () => {
    renderPage();
    const block = sample("arabic");
    expect(block.getAttribute("dir")).toBe("rtl");
    expect(column("arabic", "main").getByRole("heading", { level: 3, name: "الطلب" })).toBeTruthy();
    expect(
      column("arabic", "aside").getByRole("heading", { level: 3, name: "الملخص" }),
    ).toBeTruthy();
  });

  it("adds a history section to the live side column and reports it", () => {
    renderPage();
    const status = document.querySelector("[data-sample='live-status']") as HTMLElement;
    expect(column("live", "aside").queryByRole("heading", { name: "Live history" })).toBeNull();
    expect(status.textContent).toBe("The side column holds the summary only.");

    fireEvent.click(screen.getByRole("switch", { name: "Show the history" }));
    expect(column("live", "aside").getByRole("heading", { name: "Live history" })).toBeTruthy();
    expect(column("live", "main").queryByRole("heading", { name: "Live history" })).toBeNull();
    expect(status.textContent).toBe("The history is in the side column.");
  });
});
