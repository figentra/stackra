/**
 * Stackra file contract:
 * Purpose: proves the web NavigationList is a navigation landmark with a default or the caller's name, draws links with
 *          their hrefs, marks the current page with `aria-current="page"` and an entry that only holds it with `true`,
 *          draws a group heading that names its nested list, nests children after a link, draws a badge unless it is
 *          zero or empty, refuses a disabled entry from pointer and keyboard, runs a press-only entry's handler,
 *          navigates through the nearest RouterProvider, keeps the label as the name in the compact rail with a tooltip
 *          on focus, shows a shortcut in a tooltip, passes unknown props through and refuses a raw `aria-label` at the
 *          type level.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decisions 1, 3 and 5); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-156
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { NavigationList, type NavigationListProps } from "#react/navigation-list/navigation-list";
import { RouterProvider } from "#react/index";

const ITEMS: readonly NavigationItem[] = [
  { id: "home", label: "Home", href: "/", icon: "house" },
  { id: "orders", label: "Orders", href: "/orders", badge: 12, shortcut: "G then O" },
  {
    id: "settings",
    label: "Settings",
    children: [
      { id: "profile", label: "Profile", href: "/settings/profile", isCurrent: true },
      { id: "billing", label: "Billing", href: "/settings/billing" },
    ],
  },
];

/** Puts the page in keyboard modality, then focuses the element: React Aria shows a tooltip on keyboard focus only. */
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: "Tab" });
  act(() => element.focus());
}

describe("NavigationList (web)", () => {
  it("is a navigation landmark with a default name, or the caller's", () => {
    const { rerender } = render(<NavigationList items={ITEMS} />);
    expect(screen.getByRole("navigation", { name: "Navigation" })).toBeTruthy();
    rerender(<NavigationList items={ITEMS} label="Main navigation" />);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
  });

  it("draws every entry with somewhere to go as a link with its href", () => {
    render(<NavigationList items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: /^Orders/ }).getAttribute("href")).toBe("/orders");
  });

  it("marks the current page, and only it, with aria-current page", () => {
    render(<NavigationList items={ITEMS} />);
    const current = document.querySelectorAll("[aria-current]");
    expect(current).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Profile" }).getAttribute("aria-current")).toBe("page");
  });

  it("marks an entry that only holds the current one with aria-current true", () => {
    render(
      <NavigationList
        items={[
          {
            id: "settings",
            label: "Settings",
            href: "/settings",
            children: [
              { id: "profile", label: "Profile", href: "/settings/profile", isCurrent: true },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("aria-current")).toBe(
      "true",
    );
    expect(screen.getByRole("link", { name: "Profile" }).getAttribute("aria-current")).toBe("page");
  });

  it("draws a group heading, not a link, whose nested list it names", () => {
    render(<NavigationList items={ITEMS} />);
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
    const nested = screen.getByRole("list", { name: "Settings" });
    expect(
      within(nested)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Profile", "Billing"]);
  });

  it("nests the children of a link after it, in the same item", () => {
    render(
      <NavigationList
        items={[
          {
            id: "orders",
            label: "Orders",
            href: "/orders",
            children: [{ id: "returns", label: "Returns", href: "/orders/returns" }],
          },
        ]}
      />,
    );
    const item = screen.getByRole("link", { name: "Orders" }).closest("li");
    expect(item).toBeTruthy();
    expect(within(item as HTMLElement).getByRole("link", { name: "Returns" })).toBeTruthy();
  });

  it("draws a badge after the label, and none for zero or an empty string", () => {
    render(
      <NavigationList
        items={[
          { id: "a", label: "Alpha", href: "/a", badge: 3 },
          { id: "b", label: "Beta", href: "/b", badge: 0 },
          { id: "c", label: "Gamma", href: "/c", badge: "" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /^Alpha\s*3$/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Beta" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Gamma" })).toBeTruthy();
  });

  it("refuses a disabled entry: no href, announced disabled, not a navigation entry", () => {
    const onPress = vi.fn();
    render(
      <NavigationList
        items={[{ id: "a", label: "Alpha", href: "/a", isDisabled: true, onPress }]}
      />,
    );
    const link = screen.getByRole("link", { name: "Alpha" });
    expect(link.hasAttribute("href")).toBe(false);
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.hasAttribute("data-navigation-item")).toBe(false);
    act(() => link.click());
    fireEvent.keyDown(link, { key: "Enter" });
    expect(onPress).not.toHaveBeenCalled();
  });

  it("runs the handler of a press-only entry from the pointer and from Enter", () => {
    const onPress = vi.fn();
    render(<NavigationList items={[{ id: "a", label: "Alpha", onPress }]} />);
    const entry = screen.getByRole("link", { name: "Alpha" });
    act(() => entry.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(entry, { key: "Enter" });
    fireEvent.keyUp(entry, { key: "Enter" });
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("marks each enabled entry for AppShell's drawer to close on", () => {
    render(<NavigationList items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Home" }).hasAttribute("data-navigation-item")).toBe(
      true,
    );
  });

  it("navigates through the nearest RouterProvider, with the router's own href", () => {
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate} useHref={(href) => `/base${href}`}>
        <NavigationList items={ITEMS} />
      </RouterProvider>,
    );
    const link = screen.getByRole("link", { name: "Home" });
    expect(link.getAttribute("href")).toBe("/base/");
    act(() => link.click());
    expect(navigate).toHaveBeenCalledWith("/", undefined);
  });

  it("shows a shortcut in a tooltip on keyboard focus and not before", () => {
    render(<NavigationList items={ITEMS} />);
    expect(screen.queryByRole("tooltip")).toBeNull();
    focusByKeyboard(screen.getByRole("link", { name: /^Orders/ }));
    expect(screen.getByRole("tooltip").textContent).toBe("G then O");
  });

  it("keeps the label as the name in the compact rail and shows it, with the shortcut, in a tooltip", () => {
    render(<NavigationList items={ITEMS} isCompact />);
    const link = screen.getByRole("link", { name: /^Orders/ });
    expect(link.querySelector(".sr-only")?.textContent).toBe("Orders");
    focusByKeyboard(link);
    expect(screen.getByRole("tooltip").textContent).toBe("Orders (G then O)");
  });

  it("draws an entry with no icon as its first letter in the compact rail, hidden from screen readers", () => {
    render(<NavigationList items={[{ id: "a", label: "Alpha", href: "/a" }]} isCompact />);
    const mark = screen.getByRole("link", { name: "Alpha" }).querySelector("[aria-hidden='true']");
    expect(mark?.textContent).toBe("A");
  });

  it("draws no group heading in the compact rail", () => {
    render(<NavigationList items={ITEMS} isCompact />);
    expect(screen.queryByText("Settings")).toBeNull();
    expect(screen.getByRole("link", { name: "Profile" })).toBeTruthy();
  });

  it("passes unknown nav props through and refuses a raw aria-label at the type level", () => {
    render(<NavigationList items={ITEMS} data-testid="nav" id="main-nav" />);
    expect(screen.getByTestId("nav").id).toBe("main-nav");
    // @ts-expect-error: the landmark's name is `label`, not `aria-label`
    const refused: NavigationListProps = { items: ITEMS, "aria-label": "x" };
    expect(refused.items).toBe(ITEMS);
  });
});
