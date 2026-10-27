/**
 * Stackra file contract:
 * Purpose: proves the page skeleton page titles the document, shows one skeleton per layout and one per animation,
 *          each naming what loads once, and a list that reloads from a table skeleton to its content.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and fake timers for the simulated reload;
 *           the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3; ADR 0022 (test
 *          placement).
 */
// @covers sta-350:FR-151
import { PageSkeletonLayout, SkeletonAnimation } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PageSkeleton } from "#src/routes/page-skeleton/page-skeleton";
import { PageSkeletonRoute } from "#src/routes/page-skeleton/page-skeleton.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PageSkeleton />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Page skeleton page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /page-skeleton under Feedback and status", () => {
    renderPage();
    expect(routePath(PageSkeletonRoute)).toBe("/page-skeleton");
    expect(PageSkeletonRoute.category).toBe("Feedback and status");
    expect(screen.getByRole("heading", { level: 1, name: "Page skeleton" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Page skeleton · Stackra Playground");
  });

  it("shows one skeleton per layout, each naming what loads", () => {
    renderPage();
    const layouts = section("Layouts");
    expect(document.querySelectorAll("#page-skeleton-layouts ~ ul [data-layout]")).toHaveLength(
      PageSkeletonLayout.length,
    );
    expect(layouts.getAllByRole("status")).toHaveLength(PageSkeletonLayout.length);
    for (const layout of PageSkeletonLayout)
      expect(layouts.getByText(`Loading the ${layout} layout`)).toBeTruthy();
  });

  it("shows the section layout in each animation", () => {
    renderPage();
    const animations = section("Animations");
    expect(animations.getAllByRole("status")).toHaveLength(SkeletonAnimation.length);
    for (const animationType of SkeletonAnimation)
      expect(animations.getByText(`Loading with ${animationType}`)).toBeTruthy();
  });

  it("reloads from a table skeleton to the content", () => {
    renderPage();
    const live = section("Loading to content");
    expect(live.getAllByRole("listitem")).toHaveLength(4);
    expect(live.queryByRole("status")).toBeNull();

    act(() => live.getByRole("button", { name: "Reload orders" }).click());
    expect(live.queryAllByRole("listitem")).toHaveLength(0);
    expect(live.getByRole("status").textContent).toBe("Loading orders");

    act(() => vi.advanceTimersByTime(1500));
    expect(live.getAllByRole("listitem")).toHaveLength(4);
    expect(live.queryByRole("status")).toBeNull();
  });
});
