/**
 * Stackra file contract:
 * Purpose: proves RowActions is a menu button named by the spec's label, lists the row's actions by their own or derived
 *          words in the spec's sections (an action no section names in a last one), hands the chosen spec to the host,
 *          leaves out an action without its permission or whose record predicate is false, draws nothing when none is
 *          left, shows the icon actions as icon buttons with `hasHoverActions`, and keeps its words in a right-to-left
 *          page.
 * Boundary: unit tier, jsdom with the real @stackra/ui `ActionMenu` and `IconButton` (HeroUI and React Aria); the
 *           permission check is a spy, translation returns the key. The Arabic case renders under `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0060 (right-to-left); the SDUI catalogue case `rowActions`
 *                     (STA-1981).
 */
// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { ActionButtonSpec } from "#core/types/action-button-spec.type";
import { RowActions } from "#react/row-actions/row-actions";

const spies = vi.hoisted(() => ({
  can: vi.fn((permission?: string) => permission !== "orders.order.refund"),
}));

vi.mock("#react/action-runner/use-can", () => ({ useCan: () => spies.can }));
vi.mock("@stackra/i18n/react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const ACTIONS: readonly ActionButtonSpec[] = [
  { action: "orders.order.cancel@1", label: "Cancel", description: "Stops the order" },
  { action: "orders.order.hold@1", label: "Hold", visibleWhen: "isOpen" },
  { action: "orders.order.refund@1", label: "Refund", permission: "orders.order.refund" },
  { action: "orders.order.archive@1" },
];

/** Opens the menu named `name`. */
const open = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("RowActions", () => {
  beforeAll(() => {
    // jsdom has no layout; the menu scrolls its focused item into view (as in the Dropdown test).
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });
  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("lists the shown actions by their words and hands the chosen spec to the host", async () => {
    const onAction = vi.fn();
    render(
      <RowActions
        label="Actions for order 1001"
        actions={ACTIONS}
        record={{ isOpen: false }}
        onAction={onAction}
      />,
    );
    open("Actions for order 1001");
    const cancel = await screen.findByRole("menuitem", { name: /Cancel/ });
    expect(cancel.textContent).toContain("Stops the order");
    expect(screen.queryByRole("menuitem", { name: /Hold/ })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Refund/ })).toBeNull();
    expect(
      screen.getByRole("menuitem", { name: /orders::resources\.order\.actions\.archive/ }),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(cancel);
    });
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(ACTIONS[0]));
  });

  it("groups the actions into the spec's sections", async () => {
    render(
      <RowActions
        label="Actions"
        actions={ACTIONS}
        record={{ isOpen: true }}
        sections={[{ label: "Fulfilment", actions: ["orders.order.hold@1"] }]}
        onAction={vi.fn()}
      />,
    );
    open("Actions");
    const fulfilment = await screen.findByRole("group", { name: "Fulfilment" });
    expect(fulfilment.textContent).toContain("Hold");
    expect(fulfilment.textContent).not.toContain("Cancel");
    expect(screen.getByRole("menuitem", { name: /Cancel/ })).toBeTruthy();
  });

  it("draws nothing when no action is left", () => {
    const { container } = render(
      <RowActions label="Actions" actions={[ACTIONS[2] as ActionButtonSpec]} onAction={vi.fn()} />,
    );
    expect(container.textContent).toBe("");
  });

  it("shows the icon actions as icon buttons with hover actions", async () => {
    const onAction = vi.fn();
    render(
      <RowActions
        label="Actions"
        actions={[{ action: "orders.order.cancel@1", label: "Cancel", startIcon: "x" }]}
        hasHoverActions
        onAction={onAction}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Actions" })).toBeTruthy();
  });

  it("keeps its words in a right-to-left page", async () => {
    render(
      <div dir="rtl">
        <RowActions
          label="إجراءات الطلب"
          actions={[{ action: "orders.order.cancel@1", label: "إلغاء" }]}
          onAction={vi.fn()}
        />
      </div>,
    );
    const trigger = screen.getByRole("button", { name: "إجراءات الطلب" });
    expect(trigger.closest("[dir]")?.getAttribute("dir")).toBe("rtl");
    open("إجراءات الطلب");
    expect(await screen.findByRole("menuitem", { name: /إلغاء/ })).toBeTruthy();
  });
});
