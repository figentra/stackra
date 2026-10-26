/**
 * Stackra file contract:
 * Purpose: proves the web PageHeader draws the title as the page's `h1` (or the level it is given) in the `h3` style,
 *          the description, the status and the start slot beside it, the breadcrumb trail only when it has steps,
 *          the first action as the primary button and the next two as secondary ones, a danger action in the danger
 *          colours, an action with an `href` as a link that navigates through the RouterProvider and one that is
 *          disabled as a disabled button, the actions past three in an ActionMenu named by `moreActionsLabel`, the end
 *          slot after the actions, a `label` as a named group (never a landmark), and that it passes unknown props
 *          through and refuses a missing title and the raw `aria-label` at the type level.
 * Boundary: jsdom with real HeroUI and React Aria, and an icon registry holding the ellipsis the ActionMenu draws; the
 *           theme CSS is not loaded, so classes and attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decisions 1, 4 and 5); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-165
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, render, screen, within } from "@testing-library/react";
import { Ellipsis } from "lucide-react";
import type { ReactElement } from "react";
import { RouterProvider } from "react-aria-components";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { PageHeader } from "#react/page-header/page-header";
import type { PageHeaderProps } from "#react/page-header/page-header.props";

const press = (element: HTMLElement) => act(() => element.click());

/** `count` actions named `Action 1`, `Action 2` and so on, with the given extras on the first. */
const actionsOf = (count: number, first: Partial<MenuLeafItem> = {}): MenuLeafItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `a${index + 1}`,
    label: `Action ${index + 1}`,
    ...(index === 0 ? first : {}),
  }));

/** A header inside the icon registry the ActionMenu's ellipsis needs. */
function sample(props: Partial<PageHeaderProps> = {}): ReactElement {
  return (
    <IconRegistryProvider registry={defineIconRegistry({ ellipsis: Ellipsis })}>
      <PageHeader title="Order 1042" {...props} />
    </IconRegistryProvider>
  );
}

describe("PageHeader (web)", () => {
  it("draws the title as the page's h1 in the h3 style, and takes another level", () => {
    const { rerender } = render(sample());
    const h1 = screen.getByRole("heading", { level: 1, name: "Order 1042" });
    expect(h1.classList.contains("typography--h3")).toBe(true);
    rerender(sample({ headingLevel: 2 }));
    expect(screen.getByRole("heading", { level: 2, name: "Order 1042" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("draws the description, the status and the start slot, and leaves them out when absent", () => {
    const { rerender } = render(sample());
    expect(screen.queryByText("Placed on 3 March")).toBeNull();
    rerender(
      sample({
        description: "Placed on 3 March",
        status: <span>Paid</span>,
        startContent: <i data-testid="lead" />,
      }),
    );
    expect(screen.getByText("Placed on 3 March")).toBeTruthy();
    expect(screen.getByText("Paid")).toBeTruthy();
    expect(screen.getByTestId("lead")).toBeTruthy();
  });

  it("draws the status beside the title, in the same row", () => {
    render(sample({ status: <span>Paid</span> }));
    const heading = screen.getByRole("heading");
    expect(heading.parentElement?.contains(screen.getByText("Paid"))).toBe(true);
  });

  it("draws the trail only when it has steps", () => {
    const { rerender } = render(sample({ breadcrumbs: [] }));
    expect(screen.queryByRole("navigation")).toBeNull();
    rerender(
      sample({
        breadcrumbs: [
          { id: "orders", label: "Orders", href: "/orders" },
          { id: "order", label: "Order 1042" },
        ],
      }),
    );
    const trail = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(within(trail).getByRole("link", { name: "Orders" }).getAttribute("href")).toBe(
      "/orders",
    );
  });

  it("draws the first action as the primary button and the next two as secondary ones", () => {
    render(sample({ actions: actionsOf(3) }));
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Action 1",
      "Action 2",
      "Action 3",
    ]);
    expect(buttons[0]?.classList.contains("button--primary")).toBe(true);
    expect(buttons[1]?.classList.contains("button--secondary")).toBe(true);
    expect(buttons[2]?.classList.contains("button--secondary")).toBe(true);
  });

  it("draws a danger action in the danger colours, primary or not", () => {
    const { rerender } = render(sample({ actions: actionsOf(1, { tone: "danger" }) }));
    expect(screen.getByRole("button").classList.contains("button--danger")).toBe(true);
    rerender(
      sample({
        actions: [
          { id: "a", label: "Save" },
          { id: "b", label: "Delete", tone: "danger" },
        ],
      }),
    );
    expect(
      screen.getByRole("button", { name: "Delete" }).classList.contains("button--danger-soft"),
    ).toBe(true);
  });

  it("runs an action's onPress", () => {
    const onPress = vi.fn();
    render(sample({ actions: actionsOf(1, { onPress }) }));
    press(screen.getByRole("button", { name: "Action 1" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("draws a disabled action as a disabled button that refuses presses, even with an href", () => {
    const onPress = vi.fn();
    render(sample({ actions: actionsOf(1, { isDisabled: true, href: "/x", onPress }) }));
    const button = screen.getByRole<HTMLButtonElement>("button", { name: "Action 1" });
    expect(button.disabled).toBe(true);
    expect(screen.queryByRole("link")).toBeNull();
    press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("draws an action with an href as a link that navigates through the RouterProvider", () => {
    const navigate = vi.fn();
    const onPress = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        {sample({ actions: actionsOf(1, { href: "/orders/new", onPress }) })}
      </RouterProvider>,
    );
    const link = screen.getByRole("link", { name: "Action 1" });
    expect(link.getAttribute("href")).toBe("/orders/new");
    expect(link.classList.contains("button--primary")).toBe(true);
    press(link);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/orders/new", undefined);
  });

  it("draws an action's icon before its label", () => {
    render(sample({ actions: actionsOf(1, { icon: <i data-testid="icon" /> }) }));
    const button = screen.getByRole("button", { name: "Action 1" });
    expect(button.firstElementChild?.getAttribute("data-testid")).toBe("icon");
  });

  it("puts the actions past three in an ActionMenu named by moreActionsLabel", () => {
    const onPress = vi.fn();
    render(
      sample({
        actions: [...actionsOf(4), { id: "a5", label: "Action 5", onPress }],
        moreActionsLabel: "More for this order",
      }),
    );
    expect(screen.getAllByRole("button")).toHaveLength(4);
    press(screen.getByRole("button", { name: "More for this order" }));
    const menu = screen.getByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Action 4", "Action 5"]);
    press(within(menu).getByRole("menuitem", { name: "Action 5" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("names the overflow button 'More actions' by default and draws none when everything fits", () => {
    const { rerender } = render(sample({ actions: actionsOf(4) }));
    expect(screen.getByRole("button", { name: "More actions" })).toBeTruthy();
    rerender(sample({ actions: actionsOf(3) }));
    expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
  });

  it("draws the end slot after the actions, even with no actions", () => {
    const { rerender } = render(sample({ endContent: <i data-testid="end" /> }));
    expect(screen.getByTestId("end")).toBeTruthy();
    rerender(sample({ actions: actionsOf(1), endContent: <i data-testid="end" /> }));
    const group = screen.getByTestId("end").parentElement;
    expect(group?.lastElementChild).toBe(screen.getByTestId("end"));
    expect(within(group as HTMLElement).getByRole("button", { name: "Action 1" })).toBeTruthy();
  });

  it("draws no actions group without actions or an end slot", () => {
    const { container } = render(sample());
    expect(container.querySelector("[data-slot='page-actions']")).toBeNull();
  });

  it("is a named group, never a landmark, when it has a label", () => {
    const { rerender } = render(sample());
    expect(screen.queryByRole("group")).toBeNull();
    rerender(sample({ label: "Order header" }));
    expect(screen.getByRole("group", { name: "Order header" }).tagName).toBe("HEADER");
    expect(screen.queryByRole("banner")).toBeNull();
  });

  it("passes unknown props through and refuses a missing title and the raw aria-label", () => {
    render(sample({ id: "top", className: "extra", "data-testid": "page-header" } as never));
    expect(screen.getByTestId("page-header").id).toBe("top");
    expect(screen.getByTestId("page-header").className).toContain("extra");
    // @ts-expect-error: the title is required
    const untitled: PageHeaderProps = { description: "No title" };
    // @ts-expect-error: `label` is the landmark's name, not `aria-label`
    const raw: PageHeaderProps = { title: "Orders", "aria-label": "Header" };
    expect([untitled, raw]).toHaveLength(2);
  });
});
