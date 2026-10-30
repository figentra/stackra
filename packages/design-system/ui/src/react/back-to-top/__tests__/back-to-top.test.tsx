/**
 * Stackra file contract:
 * Purpose: proves the web BackToTop stays hidden above the threshold, appears once the window is scrolled past it,
 *          and on press moves focus to the target and scrolls the window to the top (instantly under reduced motion).
 * Boundary: jsdom with real HeroUI; `window.scrollTo` is a stub and reduced motion is on.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 2.4.3; STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { BackToTop } from "#react/back-to-top/back-to-top";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  return {
    useReducedMotion: () => true,
    motion: {
      div: ({ children, className }: Record<string, unknown>) =>
        createElement("div", { className }, children as never),
    },
  };
});

describe("BackToTop (web)", () => {
  it("appears past the threshold, focuses the target and scrolls to the top", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: scrollTo, configurable: true });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
    render(
      <>
        <h1 id="page-title">Orders</h1>
        <BackToTop threshold={300} focusTargetId="page-title" />
      </>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    act(() => {
      (window as { scrollY: number }).scrollY = 800;
      window.dispatchEvent(new Event("scroll"));
    });
    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    const title = screen.getByRole("heading", { name: "Orders" });
    expect(document.activeElement).toBe(title);
    expect(title.getAttribute("tabindex")).toBe("-1");
  });
});
