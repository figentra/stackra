/**
 * Stackra file contract:
 * Purpose: proves the web AppLayout draws HeroUI Pro's shell slots around its children, hosts a Stackra `Sidebar`,
 *          names its menu toggle and aside trigger from `label` (and keeps HeroUI Pro's defaults without it), passes
 *          unknown props through, carries HeroUI Pro's own parts, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom
 *          has neither and the shell reads the breakpoint and sizes its panels through them; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-005
import { AppLayout as HeroAppLayout } from "@heroui-pro/react/app-layout";
import { render, screen } from "@testing-library/react";

import { AppLayout, useAppLayout, type AppLayoutProps } from "#react/app-layout/app-layout";
import type { AppLayoutAsideTriggerProps } from "#react/app-layout/app-layout-aside-trigger";
import type { AppLayoutMenuToggleProps } from "#react/app-layout/app-layout-menu-toggle";
import { Sidebar } from "#react/sidebar/sidebar";

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
vi.hoisted(stubBrowserApis);

beforeEach(stubBrowserApis);

function Shell({ menu, aside }: { menu?: string; aside?: string }) {
  return (
    <AppLayout
      data-testid="shell"
      navbar={
        <>
          <AppLayout.MenuToggle {...(menu ? { label: menu } : {})} />
          <AppLayout.AsideTrigger {...(aside ? { label: aside } : {})} />
        </>
      }
      sidebar={
        <Sidebar label="Main navigation">
          <Sidebar.Content>
            <Sidebar.Menu label="Navigation">
              <Sidebar.MenuItem id="home" textValue="Home" href="#home">
                <Sidebar.MenuLabel>Home</Sidebar.MenuLabel>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Content>
        </Sidebar>
      }
      aside={<p>Details</p>}
      footer={<p>Footer note</p>}
    >
      <p>Dashboard</p>
    </AppLayout>
  );
}

describe("AppLayout (web)", () => {
  it("draws its slots around the children, with a Stackra Sidebar in the sidebar slot", () => {
    render(<Shell />);
    expect(screen.getByTestId("shell")).toBeTruthy();
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Footer note")).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Main navigation" })).toBeTruthy();
    expect(screen.getByRole("treegrid", { name: "Navigation" })).toBeTruthy();
  });

  it("takes the names of its two icon buttons from label", () => {
    render(<Shell menu="Open the menu" aside="Show details" />);
    expect(screen.getByRole("button", { name: "Open the menu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show details" })).toBeTruthy();
  });

  it("keeps HeroUI Pro's default names when label is left out", () => {
    render(<Shell />);
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Toggle aside panel" })).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts and hook", () => {
    expect(AppLayout.MobileAside).toBe(HeroAppLayout.MobileAside);
    expect(typeof useAppLayout).toBe("function");
  });

  it("types the accessible name as label", () => {
    expectTypeOf<AppLayoutProps>().toHaveProperty("children");
    expectTypeOf<AppLayoutMenuToggleProps>().toHaveProperty("label");
    expectTypeOf<AppLayoutAsideTriggerProps>().toHaveProperty("label");
  });
});
