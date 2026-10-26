/**
 * Stackra file contract:
 * Purpose: proves the web Navbar names its landmark from `label`, maps the shared `size`, names the menu toggle from
 *          `label` (HeroUI Pro's `srLabel`), passes unknown props through, carries HeroUI Pro's own parts, and
 *          refuses HeroUI Pro's `aria-label` and `srLabel` and a size outside sm, md and lg.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither and the Navbar's bundle reads them; the theme CSS is not loaded, so classes and names are
 *          checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import { Navbar as HeroNavbar } from "@heroui-pro/react/navbar";
import { render, screen } from "@testing-library/react";

import { Navbar, type NavbarProps } from "#react/navbar/navbar";

// jsdom has neither `matchMedia` nor `ResizeObserver`. HeroUI Pro's Sheet reads `matchMedia` as its module loads, so the
// stubs also exist before any import; the config restores stubbed globals after each test, so `beforeEach` stubs again.
function stubBrowserApis() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}
vi.hoisted(() => stubBrowserApis());

beforeEach(() => stubBrowserApis());

describe("Navbar (web)", () => {
  it("names the navigation landmark from label and draws HeroUI Pro's parts", () => {
    render(
      <Navbar label="Main" data-testid="bar" className="extra">
        <Navbar.Header>
          <Navbar.Brand>Stackra</Navbar.Brand>
          <Navbar.Content>
            <Navbar.Item href="/docs" isCurrent>
              Docs
            </Navbar.Item>
          </Navbar.Content>
        </Navbar.Header>
      </Navbar>,
    );
    const landmark = screen.getByRole("navigation", { name: "Main" });
    expect(landmark).toBe(screen.getByTestId("bar"));
    expect(landmark.classList.contains("extra")).toBe(true);
    expect(screen.getByRole("link", { name: "Docs" }).getAttribute("aria-current")).toBe("page");
  });

  it("leaves the landmark unnamed when label is left out", () => {
    render(<Navbar data-testid="bar">x</Navbar>);
    expect(screen.getByTestId("bar").hasAttribute("aria-label")).toBe(false);
  });

  it("maps the shared size, and keeps HeroUI Pro's default without one", () => {
    const { rerender } = render(
      <Navbar>
        <Navbar.Header data-testid="header">x</Navbar.Header>
      </Navbar>,
    );
    const plain = screen.getByTestId("header").className;
    rerender(
      <Navbar size="lg">
        <Navbar.Header data-testid="header">x</Navbar.Header>
      </Navbar>,
    );
    const large = screen.getByTestId("header").className;
    rerender(
      <HeroNavbar.Root size="lg">
        <HeroNavbar.Header data-testid="header">x</HeroNavbar.Header>
      </HeroNavbar.Root>,
    );
    expect(screen.getByTestId("header").className).toBe(large);
    expect(large).not.toBe(plain);
  });

  it("names the menu toggle from label, and from ui_pro::navbar.open_menu without one", () => {
    const { rerender } = render(
      <Navbar>
        <Navbar.MenuToggle label="Show the menu" />
      </Navbar>,
    );
    expect(screen.getByRole("button", { name: "Show the menu" })).toBeTruthy();
    rerender(
      <Navbar>
        <Navbar.MenuToggle />
      </Navbar>,
    );
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of [
      "Header",
      "Brand",
      "Content",
      "Item",
      "Label",
      "Menu",
      "MenuItem",
      "Separator",
      "Spacer",
    ] as const) {
      expect(Navbar[part]).toBe(HeroNavbar[part]);
    }
  });

  it("refuses HeroUI Pro's names for the accessible name and a size outside the shared set", () => {
    expectTypeOf<NavbarProps>().toHaveProperty("label");
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<NavbarProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error `label` is the one name for the toggle's accessible name
    void (<Navbar.MenuToggle srLabel="x" />);
    // @ts-expect-error the shared sizes are sm, md and lg
    void (<Navbar size="xl">x</Navbar>);
  });
});
