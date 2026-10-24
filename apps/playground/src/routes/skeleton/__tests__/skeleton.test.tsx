/**
 * Stackra file contract:
 * Purpose: proves the skeleton page titles the document, shows a card of bones per animation, draws the group's one
 *          sweep over still tiles, and cycles the profile card from content to a named placeholder and back.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and fake timers; the theme CSS is not
 *          loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-046 sta-350:P-035
import { SkeletonAnimation } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Skeleton } from "#src/routes/skeleton/skeleton";
import { SkeletonRoute } from "#src/routes/skeleton/skeleton.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Skeleton />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Skeleton page", () => {
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

  it("titles the page and the document, and sits at /skeleton under Status", () => {
    renderPage();
    expect(SkeletonRoute.path).toBe("/skeleton");
    expect(SkeletonRoute.category).toBe("Feedback and status");
    expect(screen.getByRole("heading", { level: 1, name: "Skeleton" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Skeleton · Stackra Playground");
  });

  it("shows a card of four bones per animation", () => {
    renderPage();
    for (const animationType of SkeletonAnimation) {
      const bones = document.querySelectorAll(
        `[data-animation="${animationType}"] .skeleton--${animationType}`,
      );
      expect(bones, animationType).toHaveLength(4);
    }
  });

  it("draws one sweep over the group's still tiles and one per lone bone", () => {
    renderPage();
    const group = document.querySelector('[data-sample="group"]');
    expect(group?.classList.contains("skeleton--shimmer")).toBe(true);
    expect(group?.querySelectorAll(".skeleton--none")).toHaveLength(3);
    expect(document.querySelectorAll('[data-sample="lone"] .skeleton--shimmer')).toHaveLength(3);
  });

  it("starts loaded, then shows a named placeholder after Reload and the content again after the wait", () => {
    renderPage();
    const cycle = section("Loading to content");
    expect(cycle.getByText("Ada Lovelace", { selector: "p, span, div" })).toBeTruthy();
    expect(cycle.getByRole("status").textContent).toBe("");
    act(() => cycle.getByRole("button", { name: "Reload" }).click());
    expect(cycle.getByRole("status").textContent).toBe("Loading profile");
    expect(cycle.queryByText("Ada Lovelace")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(cycle.getByRole("status").textContent).toBe("");
    expect(cycle.getByText("Ada Lovelace", { selector: "p, span, div" })).toBeTruthy();
  });
});
