/**
 * Stackra file contract:
 * Purpose: proves the web Section is a `section` landmark named by its title (through `aria-labelledby`) or, when
 *          given, by `label`; draws the title as an `h2` that `headingLevel` moves, the description, the start slot and
 *          the body (and no body element without one); draws the first action as the primary button and the next two
 *          as secondary ones, a danger action in the danger colours, an action with an `href` as a link that navigates
 *          through the RouterProvider and a disabled one as a disabled button, the actions past three in an ActionMenu
 *          named by `moreActionsLabel`, the end slot after the actions; and that it passes unknown props through and
 *          refuses a missing title, the raw `aria-label` and `render` at the type level.
 * Boundary: jsdom with real HeroUI and React Aria, and an icon registry holding the ellipsis the ActionMenu draws; the
 *           theme CSS is not loaded, so classes and attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0314 (decisions 1, 4 and 5); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-169
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, render, screen, within } from "@testing-library/react";
import { Ellipsis } from "lucide-react";
import type { ReactElement } from "react";
import { RouterProvider } from "react-aria-components";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { Section, type SectionProps } from "#react/section/section";

const press = (element: HTMLElement) => act(() => element.click());

/** `count` actions named `Action 1`, `Action 2` and so on, with the given extras on the first. */
const actionsOf = (count: number, first: Partial<MenuLeafItem> = {}): MenuLeafItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `a${index + 1}`,
    label: `Action ${index + 1}`,
    ...(index === 0 ? first : {}),
  }));

/** A section inside the icon registry the ActionMenu's ellipsis needs. */
function sample(props: Partial<SectionProps> = {}): ReactElement {
  return (
    <IconRegistryProvider registry={defineIconRegistry({ ellipsis: Ellipsis })}>
      <Section title="Summary" {...props} />
    </IconRegistryProvider>
  );
}

describe("Section (web)", () => {
  it("is a section landmark named by its title", () => {
    render(sample());
    const region = screen.getByRole("region", { name: "Summary" });
    expect(region.tagName).toBe("SECTION");
    expect(region.classList.contains("card")).toBe(true);
    expect(region.hasAttribute("aria-label")).toBe(false);
  });

  it("is named by `label` instead when it is given, so two sections can share a title", () => {
    render(
      <>
        {sample({ label: "Billing summary" })}
        {sample({ label: "Shipping summary" })}
      </>,
    );
    const first = screen.getByRole("region", { name: "Billing summary" });
    expect(first.hasAttribute("aria-labelledby")).toBe(false);
    expect(screen.getByRole("region", { name: "Shipping summary" })).toBeTruthy();
  });

  it("draws the title as an h2 in the card title's look, and takes another level", () => {
    const { rerender } = render(sample());
    const h2 = screen.getByRole("heading", { level: 2, name: "Summary" });
    expect(h2.classList.contains("card__title")).toBe(true);
    rerender(sample({ headingLevel: 3 }));
    expect(screen.getByRole("heading", { level: 3, name: "Summary" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("draws the description and the start slot, and the body only when there is one", () => {
    const { container, rerender } = render(sample());
    expect(screen.queryByText("What the order holds")).toBeNull();
    expect(container.querySelector("[data-slot='card-content']")).toBeNull();
    rerender(
      sample({
        description: "What the order holds",
        startContent: <i data-testid="lead" />,
        children: <p>Body text</p>,
      }),
    );
    expect(screen.getByText("What the order holds")).toBeTruthy();
    expect(screen.getByTestId("lead")).toBeTruthy();
    expect(screen.getByText("Body text").parentElement?.getAttribute("data-slot")).toBe(
      "card-content",
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
    expect(buttons.every((button) => button.classList.contains("button--sm"))).toBe(true);
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

  it("puts the actions past three in an ActionMenu named by moreActionsLabel", () => {
    const onPress = vi.fn();
    render(
      sample({
        actions: [...actionsOf(4), { id: "a5", label: "Action 5", onPress }],
        moreActionsLabel: "More for this summary",
      }),
    );
    expect(screen.getAllByRole("button")).toHaveLength(4);
    press(screen.getByRole("button", { name: "More for this summary" }));
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
    const group = screen.getByTestId("end").parentElement as HTMLElement;
    expect(group.lastElementChild).toBe(screen.getByTestId("end"));
    expect(within(group).getByRole("button", { name: "Action 1" })).toBeTruthy();
  });

  it("draws no actions group without actions or an end slot", () => {
    const { container } = render(sample());
    expect(container.querySelector("[data-slot='section-actions']")).toBeNull();
  });

  it("passes unknown props through and refuses a missing title, aria-label and render", () => {
    render(sample({ id: "top", className: "extra", "data-testid": "section" } as never));
    expect(screen.getByTestId("section").id).toBe("top");
    expect(screen.getByTestId("section").className).toContain("extra");
    // @ts-expect-error: the title is required
    const untitled: SectionProps = { description: "No title" };
    // @ts-expect-error: `label` is the section's name, not `aria-label`
    const raw: SectionProps = { title: "Summary", "aria-label": "Summary" };
    // @ts-expect-error: the element is a section, so `render` is not a prop
    const rendered: SectionProps = { title: "Summary", render: () => <div /> };
    expect([untitled, raw, rendered]).toHaveLength(3);
  });
});
