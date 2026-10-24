/**
 * Stackra file contract:
 * Purpose: proves the web AppShell draws a skip link first in the tab order that targets the one focusable `main`,
 *          puts the header above the page, shows the sidebar column from the collapse breakpoint up (`md` by default,
 *          or the caller's), keeps its drawer closed until the open state says otherwise, draws the sidebar in a named
 *          drawer when open and tells a function `sidebar` where it is drawn, closes the drawer when an entry or its
 *          Close button is pressed (reporting it, controlled or not), draws no drawer without a sidebar, draws no
 *          `main` or skip link when embedded, passes unknown props through and refuses a missing page at the type level.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks or widths.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0314 (decisions 1, 4, 5 and 6); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-160
import { act, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";

import { AppShell, type AppShellProps } from "#react/app-shell/app-shell";
import { NavigationList } from "#react/navigation-list/navigation-list";

const press = (element: HTMLElement) => act(() => element.click());

/** The column the shell puts its sidebar in: the sidebar navigation's parent. */
const column = () => screen.getByRole("navigation", { name: "Sidebar navigation" }).parentElement;

const ITEMS = [
  { id: "home", label: "Home", href: "/" },
  { id: "orders", label: "Orders", href: "/orders" },
] as const;

/** A shell with a navigation list as its sidebar; the caller's props win over the defaults. */
function sample(props: Partial<AppShellProps> = {}): ReactElement {
  return (
    <AppShell
      sidebar={<NavigationList items={ITEMS} label="Sidebar navigation" />}
      header={<header>Top bar</header>}
      {...props}
    >
      <p>The page</p>
    </AppShell>
  );
}

describe("AppShell (web)", () => {
  it("draws a skip link to the main region, first in the tab order, and the page inside that region", () => {
    render(sample());
    const skip = screen.getByRole("link", { name: "Skip to main content" });
    expect(skip.getAttribute("href")).toBe("#main-content");
    const main = screen.getByRole("main");
    expect(main.id).toBe("main-content");
    expect(main.getAttribute("tabindex")).toBe("-1");
    expect(within(main).getByText("The page")).toBeTruthy();
    const links = [...document.querySelectorAll("a[href]")];
    expect(links[0]).toBe(skip);
  });

  it("takes the skip link's text and the main region's id from the caller", () => {
    render(sample({ skipLabel: "Jump to the page", mainId: "page" }));
    expect(screen.getByRole("link", { name: "Jump to the page" }).getAttribute("href")).toBe(
      "#page",
    );
    expect(screen.getByRole("main").id).toBe("page");
  });

  it("holds exactly one main landmark, with the header above it", () => {
    render(sample());
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const text = document.body.textContent ?? "";
    expect(text.indexOf("Top bar")).toBeLessThan(text.indexOf("The page"));
  });

  it("shows the sidebar column from `md` up by default, and from the caller's breakpoint", () => {
    const { rerender } = render(sample());
    expect(column()?.className).toContain("md:block");
    expect(column()?.className).toContain("hidden");
    rerender(sample({ collapseBelow: "lg" }));
    expect(column()?.className).toContain("lg:block");
  });

  it("keeps the drawer closed until the open state opens it", () => {
    render(sample());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the sidebar in a drawer named for navigation, with the sidebar drawn inside it", () => {
    render(sample({ defaultOpen: true }));
    const dialog = screen.getByRole("dialog", { name: "Navigation menu" });
    expect(within(dialog).getByRole("navigation", { name: "Sidebar navigation" })).toBeTruthy();
  });

  it("tells a function sidebar where it is drawn: false in the page, true in the drawer", () => {
    const seen: boolean[] = [];
    render(
      sample({
        defaultOpen: true,
        sidebar: ({ isInDrawer }) => {
          seen.push(isInDrawer);
          return <p>{isInDrawer ? "In the drawer" : "In the page"}</p>;
        },
      }),
    );
    expect(seen).toContain(false);
    expect(seen).toContain(true);
    expect(screen.getByRole("dialog").textContent).toContain("In the drawer");
  });

  it("closes the drawer when an entry is chosen, and reports it", () => {
    const onOpenChange = vi.fn();
    render(sample({ defaultOpen: true, onOpenChange }));
    const dialog = screen.getByRole("dialog");
    press(within(dialog).getByRole("link", { name: "Orders" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes the drawer from its Close button", () => {
    const onOpenChange = vi.fn();
    render(sample({ defaultOpen: true, onOpenChange }));
    press(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("follows isOpen when controlled, and only reports the request to close", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(sample({ isOpen: true, onOpenChange }));
    press(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeTruthy();
    rerender(sample({ isOpen: false, onOpenChange }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("draws no drawer and no sidebar column without a sidebar", () => {
    render(sample({ sidebar: undefined, isOpen: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("draws no main landmark and no skip link when embedded, and keeps the page in a region with the id", () => {
    render(sample({ isEmbedded: true }));
    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.queryByRole("link", { name: "Skip to main content" })).toBeNull();
    expect(document.getElementById("main-content")?.textContent).toBe("The page");
  });

  it("passes unknown props through and refuses a missing page at the type level", () => {
    render(sample({ id: "shell", className: "extra", "data-testid": "shell" } as AppShellProps));
    expect(screen.getByTestId("shell").id).toBe("shell");
    expect(screen.getByTestId("shell").className).toContain("extra");
    // @ts-expect-error: the page is required
    const refused: AppShellProps = { sidebar: undefined };
    expect(refused).toBeTruthy();
  });
});
