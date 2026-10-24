/**
 * Stackra file contract:
 * Purpose: proves the web AppHeader is a `header` element (the banner landmark outside `main`) that names itself only
 *          when given a `label`, draws its parts in the order start slot, title, search, end slot and user menu, keeps
 *          the search slot as the flexible gap so the end parts stay at the inline end, draws a string title as
 *          truncating semibold text and a node title as given, draws no title slot without a title, never makes the
 *          title a heading, merges the caller's classes and passes unknown props through, and refuses `aria-label` at
 *          the type level.
 * Boundary: jsdom with real React; the theme CSS is not loaded, so classes and attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0314 (decisions 1, 4 and 5); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-164
import { render, screen } from "@testing-library/react";

import { AppHeader, type AppHeaderProps } from "#react/app-header/app-header";

/** A header with every slot filled, each with its own marker text. */
function full(props: Partial<AppHeaderProps> = {}) {
  return (
    <AppHeader
      startContent={<button type="button">Open menu</button>}
      title="Acme"
      search={<input aria-label="Search" />}
      endContent={<button type="button">Notifications</button>}
      userMenu={<button type="button">Account</button>}
      {...props}
    />
  );
}

describe("AppHeader (web)", () => {
  it("is the banner landmark when it sits outside main", () => {
    render(full());
    const banner = screen.getByRole("banner");
    expect(banner.tagName).toBe("HEADER");
    expect(banner.hasAttribute("aria-label")).toBe(false);
  });

  it("takes the landmark's name from `label`", () => {
    render(full({ label: "Console top bar" }));
    expect(screen.getByRole("banner", { name: "Console top bar" })).toBeTruthy();
  });

  it("draws the parts in order: start slot, title, search, end slot, user menu", () => {
    render(full());
    const header = screen.getByRole("banner");
    const order = [...header.querySelectorAll("button, input, [data-slot='app-header-title']")].map(
      (node) => node.textContent || node.getAttribute("aria-label"),
    );
    expect(order).toEqual(["Open menu", "Acme", "Search", "Notifications", "Account"]);
  });

  it("keeps the search slot as the flexible gap, with or without a search", () => {
    const { container, rerender } = render(full());
    const slot = () => container.querySelector("[data-slot='app-header-search']");
    expect(slot()?.className).toContain("flex-1");
    expect(slot()?.querySelector("input")).toBeTruthy();
    rerender(full({ search: undefined }));
    expect(slot()?.className).toContain("flex-1");
    expect(slot()?.childElementCount).toBe(0);
  });

  it("draws a string title as truncating semibold text and a node title as given", () => {
    const { container, rerender } = render(full());
    const slot = () => container.querySelector("[data-slot='app-header-title']");
    expect(slot()?.className).toContain("truncate");
    expect(slot()?.className).toContain("font-semibold");
    rerender(full({ title: <img alt="Acme logo" src="/logo.svg" /> }));
    expect(slot()?.className).not.toContain("truncate");
    expect(screen.getByRole("img", { name: "Acme logo" })).toBeTruthy();
  });

  it("draws no title slot and no end slot when they are left out", () => {
    const { container } = render(<AppHeader />);
    expect(container.querySelector("[data-slot='app-header-title']")).toBeNull();
    expect(container.querySelector("[data-slot='app-header-actions']")).toBeNull();
  });

  it("never makes the title a heading, because the page's h1 is PageHeader's", () => {
    render(full());
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("merges the caller's classes and passes unknown props through", () => {
    render(full({ className: "extra", id: "top", "data-testid": "bar" } as AppHeaderProps));
    const bar = screen.getByTestId("bar");
    expect(bar.id).toBe("top");
    expect(bar.className).toContain("extra");
    expect(bar.className).toContain("border-b");
  });

  it("refuses the raw `aria-label` at the type level", () => {
    // @ts-expect-error: `label` is the landmark's name, not `aria-label`
    const refused: AppHeaderProps = { "aria-label": "Top bar" };
    expect(refused).toBeTruthy();
  });
});
