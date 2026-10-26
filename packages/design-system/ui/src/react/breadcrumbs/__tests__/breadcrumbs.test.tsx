/**
 * Stackra file contract:
 * Purpose: proves the web Breadcrumbs draws the trail as a named navigation landmark holding an ordered list, makes
 *          every step but the last a link with its href, marks the last as the current page and not a link, draws one
 *          separator fewer than steps, runs a step's handler, navigates through the nearest RouterProvider, passes
 *          unknown HeroUI props through, and refuses JSX children at the type level.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *          not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-144
import { act, render, screen, within } from "@testing-library/react";

import type { BreadcrumbItem } from "#contracts/types/breadcrumb-item.type";
import { Breadcrumbs } from "#react/breadcrumbs/breadcrumbs";
import type { BreadcrumbsProps } from "#react/breadcrumbs/breadcrumbs.props";
import { RouterProvider } from "#react/index";

const TRAIL: readonly BreadcrumbItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "orders", label: "Orders", href: "/orders" },
  { id: "order", label: "Order 1042", href: "/orders/ord_1042" },
];

describe("Breadcrumbs (web)", () => {
  it("is a navigation landmark with a default name, or the caller's, over an ordered list", () => {
    const { rerender } = render(<Breadcrumbs items={TRAIL} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
    rerender(<Breadcrumbs items={TRAIL} label="Trail" />);
    expect(screen.getByRole("navigation", { name: "Trail" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Trail" }).tagName).toBe("OL");
  });

  it("makes every step but the last a link with its href", () => {
    render(<Breadcrumbs items={TRAIL} />);
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Orders" }).getAttribute("href")).toBe("/orders");
  });

  it("marks the last step as the current page, drawn as text with no href", () => {
    render(<Breadcrumbs items={TRAIL} />);
    const current = screen.getByText("Order 1042");
    const marked = current.closest("[aria-current='page']");
    expect(marked).toBeTruthy();
    expect(marked?.hasAttribute("href")).toBe(false);
    expect(marked?.tagName).not.toBe("A");
  });

  it("draws one separator fewer than steps", () => {
    render(<Breadcrumbs items={TRAIL} />);
    const separators = document.querySelectorAll("[data-slot='breadcrumbs-separator']");
    expect(separators).toHaveLength(2);
  });

  it("draws a single step as the current page and no separator", () => {
    render(<Breadcrumbs items={[{ id: "home", label: "Home", href: "/" }]} />);
    // React Aria draws the current page as a disabled text item, so what must be absent is an anchor.
    expect(document.querySelector("a")).toBeNull();
    expect(document.querySelectorAll("[data-slot='breadcrumbs-separator']")).toHaveLength(0);
    expect(screen.getByText("Home").closest("[aria-current='page']")).toBeTruthy();
  });

  it("runs a step's handler on press, for a step with only a handler", () => {
    const onPress = vi.fn();
    render(
      <Breadcrumbs
        items={[
          { id: "home", label: "Home", onPress },
          { id: "here", label: "Here" },
        ]}
      />,
    );
    act(() => screen.getByRole("link", { name: "Home" }).click());
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("does not run the handler of the current page", () => {
    const onPress = vi.fn();
    render(
      <Breadcrumbs
        items={[
          { id: "home", label: "Home", href: "/" },
          { id: "here", label: "Here", onPress },
        ]}
      />,
    );
    act(() => screen.getByText("Here").click());
    expect(onPress).not.toHaveBeenCalled();
  });

  it("navigates a step through the nearest RouterProvider, with the router's own href", () => {
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate} useHref={(href) => `/base${href}`}>
        <Breadcrumbs items={TRAIL} />
      </RouterProvider>,
    );
    const link = screen.getByRole("link", { name: "Orders" });
    expect(link.getAttribute("href")).toBe("/base/orders");
    act(() => link.click());
    expect(navigate).toHaveBeenCalledWith("/orders", undefined);
  });

  it("passes HeroUI's own props through, the separator and the class name included", () => {
    render(
      <Breadcrumbs
        items={TRAIL}
        separator={<span data-testid="slash">/</span>}
        className="gap-4"
        data-testid="trail"
      />,
    );
    expect(screen.getAllByTestId("slash")).toHaveLength(2);
    expect(screen.getByTestId("trail").classList.contains("gap-4")).toBe(true);
  });

  it("lets a long trail wrap in a narrow column", () => {
    render(<Breadcrumbs items={TRAIL} data-testid="trail" />);
    expect(screen.getByTestId("trail").classList.contains("flex-wrap")).toBe(true);
  });

  it("refuses JSX children and the element's own aria-label at the type level", () => {
    // @ts-expect-error -- the trail is `items`: children are not a prop
    const withChildren: BreadcrumbsProps = { items: TRAIL, children: "x" };
    // @ts-expect-error -- the landmark's name is the contract's `label`
    const withAria: BreadcrumbsProps = { items: TRAIL, "aria-label": "x" };
    expect([withChildren, withAria]).toHaveLength(2);
  });
});
