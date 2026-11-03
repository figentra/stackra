/**
 * Stackra file contract:
 * Purpose: unit tests of `QuickCreate`: it lists the resources of the panel's area that opt in and whose create action
 *          the viewer may run, opens the chosen one's create form in the action input modal and closes it, and draws
 *          nothing when no resource is offered.
 * Boundary: unit tier, jsdom with the real @stackra/ui `ActionMenu`; the permission check and translation are
 *           stand-ins, the modal a recording stand-in.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 21); build-list item 53 (STA-1981).
 */
// @vitest-environment jsdom
import { actionRef } from "@stackra/clients";
import { ApiArea } from "@stackra/contracts";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import { registerResources } from "#core/functions/register-resources.function";
import { resource } from "#core/functions/resource.function";
import type { ResourceTree } from "#core/types/resource-tree.type";
import { PanelContext } from "#react/panel-shell/panel-context";
import { QuickCreate } from "#react/quick-create/quick-create";
import { registerPanelPages } from "#react/route-pages/register-panel-pages.function";

const spies = vi.hoisted(() => ({
  can: vi.fn((permission?: string) => permission !== "orders.refund.create"),
  modal: [] as { readonly resourceKey: string; readonly keys: readonly string[] }[],
}));

vi.mock("#react/action-runner/use-can", () => ({ useCan: () => spies.can }));
vi.mock("@stackra/i18n/react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("#react/resource-pages/action-input-modal", async () => {
  const { createElement } = await import("react");
  return {
    ActionInputModal: (props: {
      readonly resourceKey: string;
      readonly keys: readonly string[];
      readonly onClose: () => void;
    }) => {
      spies.modal.push({ resourceKey: props.resourceKey, keys: props.keys });
      return createElement("button", { type: "button", onClick: props.onClose }, "close modal");
    },
  };
});

const CreateOrder = actionRef("orders.order.create@1", {
  input: z.object({ note: z.string(), customerId: z.string() }),
  output: z.object({ id: z.string() }),
});
const CreateRefund = actionRef("orders.refund.create@1", {
  input: z.object({ amount: z.number() }),
  output: z.object({ id: z.string() }),
});

const TREES = {
  "orders.order": {
    options: { area: ApiArea.Admin, operations: { create: CreateOrder }, quickCreate: true },
  },
  "orders.refund": {
    options: { area: ApiArea.Admin, operations: { create: CreateRefund }, quickCreate: true },
  },
  "orders.note": {
    options: { area: ApiArea.Admin, operations: { create: true }, quickCreate: true },
  },
  "orders.tag": { options: { area: ApiArea.Admin, operations: { create: CreateOrder } } },
} as unknown as Readonly<Record<string, ResourceTree>>;

const RESOURCES = ["order", "refund", "note", "tag"].map((model) =>
  resource(`orders.${model}`, { base: `/orders/${model}s` }),
);

/** Draws the menu in the admin panel. */
const draw = () =>
  render(
    <PanelContext value={{ panel: { key: "admin", path: "/", area: ApiArea.Admin } }}>
      <QuickCreate />
    </PanelContext>,
  );

describe("QuickCreate", () => {
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
    spies.modal.length = 0;
  });

  it("offers the opted-in resources the viewer may create and opens the chosen form", async () => {
    const trees = registerResources(TREES);
    const dispose = registerPanelPages({ resources: RESOURCES });
    draw();
    fireEvent.click(screen.getByRole("button", { name: "panel::resources.create" }));
    const order = await screen.findByRole("menuitem", { name: /orders::resources\.order\.title/ });
    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
    await act(async () => {
      fireEvent.click(order);
    });
    expect(spies.modal.at(-1)).toEqual({
      resourceKey: "orders.order",
      keys: ["note", "customerId"],
    });
    fireEvent.click(screen.getByRole("button", { name: "close modal" }));
    expect(screen.queryByRole("button", { name: "close modal" })).toBeNull();
    dispose();
    trees();
  });

  it("draws nothing when no resource is offered", () => {
    const dispose = registerPanelPages({ resources: [] });
    const { container } = draw();
    expect(container.innerHTML).toBe("");
    dispose();
  });
});
