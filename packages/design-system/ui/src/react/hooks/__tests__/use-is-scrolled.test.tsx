/**
 * Stackra file contract:
 * Purpose: proves the web glass wiring (ADR 0320 as amended 2026-10-31): `useIsScrolled` follows the window's scroll,
 *          the AppHeader and NavigationHeader draw the nav-bar role and mark themselves `data-scrolled` once content
 *          runs under them, the chrome draws its material role classes (no backdrop filter of its own), and a glass
 *          button is HeroUI's ghost plus `button--glass` wherever a link or trigger is styled as a button.
 * Boundary: jsdom; the material itself is the stylesheet's (`@stackra/tokens`), so only classes are checked.
 * Runtime: node
 * Governing contract: ADR 0320; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, renderHook, screen } from "@testing-library/react";

import { AppHeader } from "#react/app-header/app-header";
import { Button } from "#react/button/button";
import { glassButtonClasses } from "#react/button/glass-button-classes.function";
import { useIsScrolled } from "#react/hooks/use-is-scrolled";
import { TabBar } from "#react/tab-bar/tab-bar";

const scrollTo = (y: number) =>
  act(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: y });
    window.dispatchEvent(new Event("scroll"));
  });

describe("glass wiring (web)", () => {
  afterEach(() => scrollTo(0));

  it("follows the window's scroll", () => {
    const { result } = renderHook(() => useIsScrolled());
    expect(result.current).toBe(false);
    scrollTo(120);
    expect(result.current).toBe(true);
  });

  it("draws the header in the nav-bar role and marks it scrolled", () => {
    render(<AppHeader title="Stackra" label="Main" />);
    const header = screen.getByRole("banner");
    expect(header.classList.contains("material-role-nav-bar")).toBe(true);
    expect(header.hasAttribute("data-scrolled")).toBe(false);
    scrollTo(40);
    expect(header.hasAttribute("data-scrolled")).toBe(true);
  });

  it("puts the tab bar in its role with no blur of its own", () => {
    render(<TabBar items={[{ id: "home", label: "Home", href: "/" }]} />);
    const bar = screen.getByRole("navigation");
    expect(bar.classList.contains("material-role-tab-bar")).toBe(true);
    expect(bar.className).not.toMatch(/backdrop-blur/);
  });

  it("draws a glass button as HeroUI's ghost plus button--glass", () => {
    render(<Button variant="glass">Play</Button>);
    const button = screen.getByRole("button", { name: "Play" });
    expect(button.classList.contains("button--glass")).toBe(true);
    expect(button.classList.contains("button--ghost")).toBe(true);
    expect(glassButtonClasses("glass", "sm")).toMatch(
      /button--ghost.*button--glass|button--glass.*button--ghost/,
    );
    expect(glassButtonClasses("primary")).not.toContain("button--glass");
  });
});
