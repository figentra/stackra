/**
 * Stackra file contract:
 * Purpose: proves the web NavigationHeader is a `header` element that names itself only when given a `label`, draws the
 *          title as the page's `h1` (or the level it is given) in a compact row with the back button, start slot, title
 *          and end slot in order, moves the title under the bar and draws it large with `hasLargeTitle`, draws a back
 *          button for `onBack` (a button) and for `backHref` (a link that also calls `onBack`) and none without either,
 *          names the back button from `backLabel`, hides the end slot when empty, merges the caller's classes and passes
 *          unknown props through, and refuses `aria-label` at the type level.
 * Boundary: jsdom with real React and HeroUI; the theme CSS is not loaded, so classes and attributes are checked, not
 *           looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decisions 1, 4, 5 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-175
import { act, render, screen } from "@testing-library/react";

import { NavigationHeader } from "#react/navigation-header/navigation-header";
import type { NavigationHeaderProps } from "#react/navigation-header/navigation-header.props";

describe("NavigationHeader (web)", () => {
  it("is a header element, unnamed unless given a label", () => {
    const { rerender } = render(<NavigationHeader title="Orders" />);
    expect(screen.getByRole("banner").tagName).toBe("HEADER");
    expect(screen.getByRole("banner").hasAttribute("aria-label")).toBe(false);
    rerender(<NavigationHeader title="Orders" label="Orders bar" />);
    expect(screen.getByRole("banner", { name: "Orders bar" })).toBeTruthy();
  });

  it("draws the title as the h1, or the level it is given", () => {
    const { rerender } = render(<NavigationHeader title="Orders" />);
    expect(screen.getByRole("heading", { level: 1, name: "Orders" })).toBeTruthy();
    rerender(<NavigationHeader title="Orders" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Orders" })).toBeTruthy();
  });

  it("draws back button, start slot, title and end slot in order, the title taking the room left", () => {
    render(
      <NavigationHeader
        title="Orders"
        onBack={() => undefined}
        startContent={<button type="button">Start</button>}
        endContent={<button type="button">Filter</button>}
      />,
    );
    const order = [...screen.getByRole("banner").querySelectorAll("button, h1")].map(
      (node) => node.textContent || node.getAttribute("aria-label"),
    );
    expect(order).toEqual(["Back", "Start", "Orders", "Filter"]);
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("flex-1");
  });

  it("draws the title large under the bar with hasLargeTitle", () => {
    render(<NavigationHeader title="Orders" hasLargeTitle onBack={() => undefined} />);
    const header = screen.getByRole("banner");
    const heading = screen.getByRole("heading", { level: 1 });
    const row = header.firstElementChild as HTMLElement;
    expect(row.contains(heading)).toBe(false);
    expect(row.nextElementSibling).toBe(heading);
    expect(heading.className).not.toContain("truncate");
  });

  it("draws a back button for onBack and runs it on press", () => {
    const onBack = vi.fn();
    render(<NavigationHeader title="Orders" onBack={onBack} />);
    act(() => screen.getByRole("button", { name: "Back" }).click());
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("draws a back link for backHref that also calls onBack", () => {
    const onBack = vi.fn();
    render(<NavigationHeader title="Orders" backHref="/home" backLabel="Home" onBack={onBack} />);
    const link = screen.getByRole("link", { name: "Home" });
    expect(link.getAttribute("href")).toBe("/home");
    act(() => link.click());
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("draws no back control without onBack or backHref", () => {
    render(<NavigationHeader title="Orders" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("names the back button from backLabel", () => {
    render(<NavigationHeader title="Orders" onBack={() => undefined} backLabel="Retour" />);
    expect(screen.getByRole("button", { name: "Retour" })).toBeTruthy();
  });

  it("draws no end slot when it is left out", () => {
    const { container } = render(<NavigationHeader title="Orders" />);
    expect(container.querySelector("[data-slot='navigation-header-actions']")).toBeNull();
  });

  it("merges the caller's classes and passes unknown props to the header", () => {
    render(<NavigationHeader title="Orders" className="extra" data-testid="bar" />);
    const bar = screen.getByTestId("bar");
    expect(bar.className).toContain("extra");
    expect(bar.className).toContain("border-b");
  });

  it("refuses the raw `aria-label` at the type level", () => {
    // @ts-expect-error: `label` is the landmark's name, not `aria-label`
    const refused: NavigationHeaderProps = { title: "Orders", "aria-label": "Bar" };
    expect(refused).toBeTruthy();
  });
});
