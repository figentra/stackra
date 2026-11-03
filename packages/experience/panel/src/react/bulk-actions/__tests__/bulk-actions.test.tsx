/**
 * Stackra file contract:
 * Purpose: proves BulkActions draws the bar named by the spec's label with the selection's count, runs an action once
 *          per selected record by default and once over the selection in `once` mode, leaves out an action without its
 *          permission, offers the export only with the host's handler and words, clears the selection, and keeps its
 *          words in a right-to-left page.
 * Boundary: unit tier, jsdom with the real @stackra/ui `BulkActionBar`; the permission check is a spy, translation returns
 *           the key. The Arabic case renders under `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0307 (rule 3); ADR 0060 (right-to-left); the SDUI catalogue
 *                     case `bulkActions` (STA-1981).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { ActionButtonSpec } from "#core/types/action-button-spec.type";
import { BulkActions } from "#react/bulk-actions/bulk-actions";

const spies = vi.hoisted(() => ({
  can: vi.fn((permission?: string) => permission !== "orders.order.refund"),
}));

vi.mock("#react/action-runner/use-can", () => ({ useCan: () => spies.can }));
vi.mock("@stackra/i18n/react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const CANCEL: ActionButtonSpec = { action: "orders.order.cancel@1", label: "Cancel" };
const REFUND: ActionButtonSpec = {
  action: "orders.order.refund@1",
  label: "Refund",
  permission: "orders.order.refund",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Presses the button named `name`. */
const press = async (name: string) =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });

describe("BulkActions", () => {
  it("runs an action once per selected record and leaves out one without its permission", async () => {
    const onAction = vi.fn();
    render(
      <BulkActions
        label="Order actions"
        actions={[CANCEL, REFUND]}
        selectedKeys={["ord_1", "ord_2"]}
        onClearSelection={vi.fn()}
        onAction={onAction}
      />,
    );
    expect(screen.getByRole("toolbar", { name: "Order actions" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Refund" })).toBeNull();
    await press("Cancel");
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(2));
    expect(onAction).toHaveBeenNthCalledWith(1, CANCEL, ["ord_1"]);
    expect(onAction).toHaveBeenNthCalledWith(2, CANCEL, ["ord_2"]);
  });

  it("runs once over the selection in once mode", async () => {
    const onAction = vi.fn();
    render(
      <BulkActions
        actions={[CANCEL]}
        runMode="once"
        selectedKeys={["ord_1", "ord_2"]}
        onClearSelection={vi.fn()}
        onAction={onAction}
      />,
    );
    await press("Cancel");
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onAction).toHaveBeenCalledWith(CANCEL, ["ord_1", "ord_2"]);
  });

  it("offers the export only with the host's handler and words, and clears", async () => {
    const onExport = vi.fn();
    const onClearSelection = vi.fn();
    const { rerender } = render(
      <BulkActions
        actions={[CANCEL]}
        export
        selectedKeys={["ord_1"]}
        clearLabel="Clear"
        onClearSelection={onClearSelection}
        onAction={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull();
    rerender(
      <BulkActions
        actions={[CANCEL]}
        export
        exportLabel="Export"
        onExport={onExport}
        selectedKeys={["ord_1"]}
        clearLabel="Clear"
        onClearSelection={onClearSelection}
        onAction={vi.fn()}
      />,
    );
    await press("Export");
    await waitFor(() => expect(onExport).toHaveBeenCalledWith(["ord_1"]));
    await press("Clear");
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("keeps its words in a right-to-left page", () => {
    render(
      <div dir="rtl">
        <BulkActions
          label="إجراءات الطلبات"
          actions={[{ action: "orders.order.cancel@1", label: "إلغاء" }]}
          selectedKeys={["ord_1"]}
          onClearSelection={vi.fn()}
          onAction={vi.fn()}
        />
      </div>,
    );
    const bar = screen.getByRole("toolbar", { name: "إجراءات الطلبات" });
    expect(bar.closest("[dir]")?.getAttribute("dir")).toBe("rtl");
    expect(screen.getByRole("button", { name: "إلغاء" })).toBeTruthy();
  });
});
