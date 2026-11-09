/**
 * Stackra file contract:
 * Purpose: proves the ActionButton is a button named by the host's label (or the spec's accessible name), runs its action
 *          through the action runner with its input by pointer and keyboard and reports the run, asks with the spec's
 *          confirmation, calls the host's handler instead of a run, is a link with `href`, hides without its permission
 *          or while its record predicate is not true, ties a disabled button's reason to it as its description, and
 *          keeps its name in a right-to-left page.
 * Boundary: unit tier, jsdom with the real @stackra/ui `Button`, `Link`, `Tooltip` and `VisuallyHidden`; the action
 *           runner and the permission check are spies, translation returns the key. The Arabic case renders under
 *           `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0139; ADR 0060 (right-to-left); the SDUI catalogue case
 *                     `actionButton` (STA-1981).
 */
// @vitest-environment jsdom
import { actionRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import { ActionButton } from "#react/action-button/action-button";

const spies = vi.hoisted(() => ({
  run: vi.fn(),
  can: vi.fn((permission?: string) => permission !== "orders.order.refund"),
}));

vi.mock("#react/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("#react/action-runner/use-can", () => ({ useCan: () => spies.can }));
vi.mock("@stackra/i18n/react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const CancelOrderAction = actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({}),
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ActionButton", () => {
  it("runs its action with its input and reports the run", async () => {
    spies.run.mockResolvedValue({ status: "done", data: {} });
    const onRun = vi.fn();
    render(
      <ActionButton action={CancelOrderAction} input={{ orderId: "ord_1" }} onRun={onRun}>
        Cancel order
      </ActionButton>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel order" }));
    });
    await waitFor(() => expect(onRun).toHaveBeenCalledWith({ status: "done", data: {} }));
    expect(spies.run).toHaveBeenCalledWith(CancelOrderAction, { orderId: "ord_1" });
  });

  it("is reached and pressed from the keyboard", async () => {
    spies.run.mockResolvedValue({ status: "done", data: {} });
    render(<ActionButton action={CancelOrderAction}>Cancel order</ActionButton>);
    const button = screen.getByRole("button", { name: "Cancel order" });
    act(() => button.focus());
    expect(document.activeElement).toBe(button);
    await act(async () => {
      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.keyUp(button, { key: "Enter" });
    });
    await waitFor(() => expect(spies.run).toHaveBeenCalledTimes(1));
  });

  it("asks with the spec's confirmation and takes its accessible name", async () => {
    spies.run.mockResolvedValue({ status: "cancelled" });
    render(
      <ActionButton
        action={CancelOrderAction}
        input={{ orderId: "ord_1" }}
        label="Cancel order 1001"
        confirm={{ title: "Cancel this order?", tone: "danger" }}
      >
        Cancel
      </ActionButton>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel order 1001" }));
    });
    await waitFor(() =>
      expect(spies.run).toHaveBeenCalledWith(
        CancelOrderAction,
        { orderId: "ord_1" },
        { confirm: { title: "Cancel this order?", tone: "danger" } },
      ),
    );
  });

  it("calls the host's handler instead of a run", async () => {
    const onPress = vi.fn();
    render(<ActionButton onPress={onPress}>New order</ActionButton>);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "New order" }));
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(spies.run).not.toHaveBeenCalled();
  });

  it("is a link with href", () => {
    render(<ActionButton href="/orders/ord_1">Open order</ActionButton>);
    expect(screen.getByRole("link", { name: "Open order" }).getAttribute("href")).toBe(
      "/orders/ord_1",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("hides without its permission or while its record predicate is not true", () => {
    const { container } = render(
      <>
        <ActionButton action={CancelOrderAction} permission="orders.order.refund">
          Refund
        </ActionButton>
        <ActionButton action={CancelOrderAction} visibleWhen="isOpen" record={{ isOpen: false }}>
          Cancel
        </ActionButton>
      </>,
    );
    expect(container.textContent).toBe("");
    cleanup();
    render(
      <ActionButton action={CancelOrderAction} visibleWhen="isOpen" record={{ isOpen: true }}>
        Cancel
      </ActionButton>,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("ties a disabled button's reason to it as its description", () => {
    render(
      <ActionButton action={CancelOrderAction} isDisabled disabledReason="Shipped orders stay">
        Cancel
      </ActionButton>,
    );
    const button = screen.getByRole("button", { name: "Cancel" });
    expect(button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true").toBe(
      true,
    );
    const described = button.getAttribute("aria-describedby");
    expect(described).toBeTruthy();
    expect(document.getElementById(described ?? "")?.textContent).toBe("Shipped orders stay");
  });

  it("keeps its name in a right-to-left page", () => {
    render(
      <div dir="rtl">
        <ActionButton action={CancelOrderAction}>إلغاء الطلب</ActionButton>
      </div>,
    );
    const button = screen.getByRole("button", { name: "إلغاء الطلب" });
    expect(button.closest("[dir]")?.getAttribute("dir")).toBe("rtl");
  });
});
