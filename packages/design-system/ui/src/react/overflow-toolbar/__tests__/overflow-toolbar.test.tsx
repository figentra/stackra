/**
 * Stackra file contract:
 * Purpose: proves the web OverflowToolbar is a toolbar named by `label` that keeps every action as a button when they
 *          fit, moves the trailing ones into a "more" menu named by `moreLabel` when they do not, runs an action's own
 *          handler then `onAction` from either place, and never exposes its measuring copy.
 * Boundary: jsdom with real HeroUI, React Aria and Motion; jsdom lays nothing out, so the widths are stubbed on the
 *           element prototype and the fit is checked, not the look.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from "@testing-library/react";

import type { OverflowToolbarContractProps } from "#contracts/types/overflow-toolbar-contract-props.type";
import { OverflowToolbar } from "#react/overflow-toolbar/overflow-toolbar";
import type { OverflowToolbarProps } from "#react/overflow-toolbar/overflow-toolbar.props";

const press = (element: HTMLElement) => act(() => element.click());

const ITEMS: OverflowToolbarContractProps["items"] = [
  { id: "refund", label: "Refund" },
  { id: "print", label: "Print receipt" },
  { id: "email", label: "Email receipt" },
  { id: "void", label: "Void", tone: "danger" },
];

/** Every element measures `button` wide and the row `row` wide. */
function stubLayout(button: number, row: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: button,
  } as DOMRect);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(row);
}

describe("OverflowToolbar (web)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps every action as a button in a named toolbar when they fit", () => {
    stubLayout(100, 400);
    render(<OverflowToolbar label="Order actions" moreLabel="More order actions" items={ITEMS} />);
    const toolbar = screen.getByRole("toolbar", { name: "Order actions" });
    expect(
      within(toolbar)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Refund", "Print receipt", "Email receipt", "Void"]);
    // The measuring copy is inert, so only the toolbar's buttons are exposed.
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("moves the trailing actions into the more menu when narrow", async () => {
    stubLayout(100, 250);
    render(<OverflowToolbar label="Order actions" moreLabel="More order actions" items={ITEMS} />);
    const toolbar = screen.getByRole("toolbar", { name: "Order actions" });
    expect(within(toolbar).getByRole("button", { name: "Refund" })).toBeTruthy();
    await waitFor(() =>
      expect(within(toolbar).queryByRole("button", { name: "Print receipt" })).toBeNull(),
    );
    press(within(toolbar).getByRole("button", { name: "More order actions" }));
    const menu = screen.getByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Print receipt", "Email receipt", "Void"]);
  });

  it("runs an action's own handler and then onAction, as a button and from the menu", () => {
    stubLayout(100, 250);
    const calls: string[] = [];
    const items = ITEMS.map((item) => ({ ...item, onPress: () => calls.push(`press:${item.id}`) }));
    render(
      <OverflowToolbar
        label="Order actions"
        moreLabel="More order actions"
        items={items}
        onAction={(id) => calls.push(`action:${id}`)}
      />,
    );
    press(screen.getByRole("button", { name: "Refund" }));
    press(screen.getByRole("button", { name: "More order actions" }));
    press(screen.getByRole("menuitem", { name: "Void" }));
    expect(calls).toEqual(["press:refund", "action:refund", "press:void", "action:void"]);
  });

  it("types: extends the contract and refuses children and aria-label", () => {
    expectTypeOf<OverflowToolbarProps>().toExtend<OverflowToolbarContractProps>();
    expectTypeOf<OverflowToolbarProps>().not.toHaveProperty("aria-label");
    expectTypeOf<OverflowToolbarProps>().not.toHaveProperty("children");
  });
});
