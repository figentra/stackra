/**
 * Stackra file contract:
 * Purpose: proves the web NavigationMenu is a named `nav` of links and panel buttons, that a button opens its panel of
 *          links with their lines, marks the current page `aria-current="page"` and its panel's button current, and
 *          that choosing a link closes the panel.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { NavigationMenu } from "#react/navigation-menu/navigation-menu";

const ITEMS = [
  {
    id: "products",
    label: "Products",
    children: [
      { id: "pos", label: "Point of sale", href: "#pos", description: "Sell in store" },
      { id: "store", label: "Online store", href: "#store", isCurrent: true },
    ],
  },
  { id: "pricing", label: "Pricing", href: "#pricing" },
] as const;

describe("NavigationMenu (web)", () => {
  it("is a named nav of links and panel buttons", () => {
    render(<NavigationMenu items={ITEMS} />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Pricing" }).getAttribute("href")).toBe("#pricing");
    const button = screen.getByRole("button", { name: "Products" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("data-current")).toBe("true");
  });

  it("opens a panel of links, marks the current page and closes on a choice", () => {
    render(<NavigationMenu items={ITEMS} label="Site" />);
    const button = screen.getByRole("button", { name: "Products" });
    act(() => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const current = screen.getByRole("link", { name: /Online store/u });
    expect(current.getAttribute("aria-current")).toBe("page");
    const pos = screen.getByRole("link", { name: /Point of sale/u });
    expect(pos.textContent).toContain("Sell in store");
    act(() => pos.click());
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});
