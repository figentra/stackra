/**
 * Stackra file contract:
 * Purpose: unit tests of `RelationManager`: the related list query read with its input bound from the record and the
 *          page size, under the related model's derived title; a row action runs with the row's id under the related
 *          model's key and the bound parent id, and one that takes more opens the modal with the parent id bound.
 * Boundary: unit tier, jsdom; `useQuery` and the action runner are spies, the modal and the web kit are DOM stand-ins,
 *           translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307; ADR 0164.
 */
// @vitest-environment jsdom
import { actionRef, queryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import { RelationManager } from "#react/resource-pages/relation-manager";

const spies = vi.hoisted(() => ({
  can: vi.fn((permission?: string) => permission !== "orders.order.refund"),
  useQuery: vi.fn(),
  run: vi.fn(),
}));

vi.mock("@stackra/clients/react", () => ({ useQuery: spies.useQuery }));
vi.mock("#react/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("#react/action-runner/use-can", () => ({ useCan: () => spies.can }));
vi.mock("@stackra/navigation/react", () => ({ useNavigate: () => vi.fn() }));
vi.mock("#react/resource-pages/action-input-modal", async () => {
  const { createElement } = await import("react");
  return {
    ActionInputModal: (props: {
      readonly idKey?: string;
      readonly ids?: readonly string[];
      readonly keys: readonly string[];
      readonly bound?: Readonly<Record<string, unknown>>;
    }) =>
      createElement(
        "dialog",
        { open: true },
        `${props.idKey}:${(props.ids ?? []).join(",")}:${props.keys.join(",")}:${JSON.stringify(props.bound)}`,
      ),
  };
});
vi.mock("@stackra/i18n/react", () => ({
  // A derived enum label is not in the catalogue, so `t` throws for it as the real one does.
  useTranslation: () => ({
    t: (key: string) => {
      if (key.includes("::enums.")) throw new RangeError(`No message for "${key}"`);
      return key;
    },
  }),
  useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
}));
vi.mock("@stackra/ui/react", async (importOriginal) => {
  const { createElement } = await import("react");
  const { useCollection } = await importOriginal<{ readonly useCollection: unknown }>();
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
  type Props = Record<string, any>;
  return {
    useCollection,
    Section: (props: Props) => createElement("section", null, props.title, props.children),
    EmptyState: (props: Props) => createElement("p", null, props.title),
    FilterBar: () => null,
    DataTable: (props: Props) =>
      createElement(
        "table",
        null,
        props.collection.rows.map((item: Props) =>
          createElement(
            "tr",
            { key: item.id },
            item.id,
            (props.rowActions?.(item) ?? []).map((action: Props) =>
              createElement(
                "button",
                { type: "button", key: action.id, onClick: () => action.onPress?.() },
                action.label,
              ),
            ),
          ),
        ),
      ),
  };
});

const ListOrderLinesQuery = queryRef("orders.order_line.list@1", {
  input: z.object({ orderId: z.string(), limit: z.number() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
});

const ReleaseHoldAction = actionRef("orders.order_line.release@1", {
  input: z.object({ orderId: z.string(), lineId: z.string() }),
  output: z.object({}),
});
const ReturnLineAction = actionRef("orders.order_line.return@1", {
  input: z.object({ orderId: z.string(), lineId: z.string(), reason: z.string() }),
  output: z.object({}),
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RelationManager", () => {
  it("reads the related rows with the bound input", () => {
    spies.useQuery.mockReturnValue({
      data: { items: [{ id: "line_1" }], hasMore: false },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    render(
      <RelationManager
        resourceKey="orders.order"
        relation={{
          kind: "table",
          query: ListOrderLinesQuery,
          columns: [{ kind: "value", key: "sku" }],
          bind: { orderId: "record.id" },
        }}
        record={{ id: "ord_1" }}
        pageSize={5}
      />,
    );
    expect(spies.useQuery).toHaveBeenCalledWith(
      ListOrderLinesQuery,
      { orderId: "ord_1", limit: 5 },
      { keepPreviousData: true },
    );
    expect(screen.getByText("orders::resources.order.relations.order_line")).toBeTruthy();
    expect(screen.getByText("line_1")).toBeTruthy();
  });

  it("runs a child-keyed row action with the row id and the bound parent id", async () => {
    spies.useQuery.mockReturnValue({
      data: { items: [{ id: "line_1" }], hasMore: false },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    spies.run.mockResolvedValue({ status: "done", data: {} });
    render(
      <RelationManager
        resourceKey="orders.order"
        relation={{
          kind: "table",
          query: ListOrderLinesQuery,
          columns: [{ kind: "value", key: "sku" }],
          bind: { orderId: "record.id" },
          actions: [ReleaseHoldAction, ReturnLineAction],
        }}
        record={{ id: "ord_1" }}
      />,
    );
    fireEvent.click(screen.getByText("orders::resources.order_line.actions.release"));
    await vi.waitFor(() =>
      expect(spies.run).toHaveBeenCalledWith(ReleaseHoldAction, {
        orderId: "ord_1",
        lineId: "line_1",
      }),
    );
    fireEvent.click(screen.getByText("orders::resources.order_line.actions.return"));
    await vi.waitFor(() =>
      expect(screen.getByText('lineId:line_1:reason:{"orderId":"ord_1"}')).toBeTruthy(),
    );
  });
});
