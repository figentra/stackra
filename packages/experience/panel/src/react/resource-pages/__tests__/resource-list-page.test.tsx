/**
 * Stackra file contract:
 * Purpose: unit tests of `ResourceListPage`: the recorded columns and their cells, the closed list input (default sort,
 *          page size, the next page's cursor), the header create link, row actions (view, edit, a placed record action
 *          run with the record id, delete) and the bulk bar fanning out per record; a resource with no registered tree
 *          shows the row's own keys.
 * Boundary: unit tier, jsdom; `useQuery`, the action runner and navigation are spies, the web kit is DOM stand-ins,
 *           translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 1 to 3); ADR 0164.
 */
// @vitest-environment jsdom
import { actionRef, queryRef } from "@stackra/clients";
import { ApiArea, SortDirection } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import { Count } from "#core/enums/count.enum";
import { registerResources } from "#core/functions/register-resources.function";
import { resource } from "#core/functions/resource.function";
import { ResourceListPage } from "#react/resource-pages/resource-list-page";

const spies = vi.hoisted(() => ({ useQuery: vi.fn(), run: vi.fn(), navigate: vi.fn() }));

vi.mock("@stackra/clients/react", () => ({ useQuery: spies.useQuery }));
vi.mock("#react/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("@stackra/navigation/react", () => ({ useNavigate: () => spies.navigate }));
vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
}));

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
  type Props = Record<string, any>;
  const buttons = (actions: { id: string; label: string; onPress?: () => void }[] = []) =>
    actions.map((action) =>
      createElement("button", { key: action.id, onClick: () => action.onPress?.() }, action.label),
    );
  return {
    Button: (props: Props) => createElement("button", { onClick: props.onPress }, props.children),
    EmptyState: (props: Props) => createElement("div", null, props.title, props.actions),
    FilterBar: (props: Props) =>
      createElement("p", null, props.filters.map((filter: Props) => filter.label).join(",")),
    PageHeader: (props: Props) =>
      createElement("header", null, props.title, buttons(props.actions)),
    DataTable: (props: Props) =>
      createElement(
        "section",
        null,
        props.filterBar,
        createElement("h2", null, props.columns.map((column: Props) => column.label).join("|")),
        props.items.length === 0
          ? props.emptyState
          : props.items.map((item: Props) =>
              createElement(
                "div",
                { key: item.id, role: "row" },
                props.columns.map((column: Props) =>
                  createElement("span", { key: column.id }, props.renderCell(item, column)),
                ),
                buttons(props.rowActions?.(item)),
              ),
            ),
        createElement("button", { onClick: props.onNext }, "next"),
        createElement(
          "button",
          { onClick: () => props.onSelectionChange?.(["ord_1", "ord_2"]) },
          "select",
        ),
        createElement("nav", null, buttons(props.bulkActions)),
      ),
  };
});

const ListOrdersQuery = queryRef("orders.order.list@1", {
  input: z.object({ limit: z.number() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
});
const GetOrderQuery = queryRef("orders.order.get@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ id: z.string() }),
});
const CreateOrderAction = actionRef("orders.order.create@1", {
  input: z.object({ note: z.string() }),
  output: z.object({ id: z.string() }),
});
const UpdateOrderAction = actionRef("orders.order.update@1", {
  input: z.object({ orderId: z.string(), note: z.string() }),
  output: z.object({ id: z.string() }),
});
const CancelOrderAction = actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({}),
});
const DeleteOrderAction = actionRef("orders.order.delete@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({}),
});

const Orders = resource("orders.order", {
  base: "/orders/orders",
  list: ListOrdersQuery,
  view: GetOrderQuery,
  create: CreateOrderAction,
  update: UpdateOrderAction,
});

const rows = [
  { id: "ord_1", status: "paid", totals: { totalMinor: 1250, currency: "SAR" } },
  { id: "ord_2", status: "open", totals: { totalMinor: 99, currency: "SAR" } },
];

/** Presses the `index`th element showing `text`. */
function press(text: string, index = 0): void {
  const element = screen.getAllByText(text)[index];
  if (element === undefined) throw new Error(`no "${text}" at ${index}`);
  fireEvent.click(element);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ResourceListPage", () => {
  it("draws the recorded table and reads the closed input page by page", () => {
    const dispose = registerResources({
      "orders.order": {
        options: { area: ApiArea.Admin, operations: { list: true, delete: DeleteOrderAction } },
        table: {
          columns: [
            { kind: "value", key: "status" },
            { kind: "money", key: "totals.totalMinor", currency: "totals.currency" },
          ],
          filters: [{ kind: "value", key: "status" }],
          defaultSort: { key: "createdAt", direction: SortDirection.Desc },
          count: Count.Estimated,
        },
        actions: [{ kind: "run", action: CancelOrderAction, bulk: true }],
      },
    });
    spies.useQuery.mockReturnValue({
      data: { items: rows, hasMore: true, nextCursor: "c2" },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    render(<ResourceListPage resource={Orders} pageSize={20} />);
    expect(
      screen.getByText(
        "orders::resources.order.columns.status|orders::resources.order.columns.totals_total_minor",
      ),
    ).toBeTruthy();
    expect(screen.getByText("SAR 1250")).toBeTruthy();
    expect(spies.useQuery.mock.calls[0]?.[0]).toBe(ListOrdersQuery);
    expect(spies.useQuery.mock.calls[0]?.[1]).toEqual({
      limit: 20,
      sort: { key: "createdAt", direction: SortDirection.Desc },
    });

    fireEvent.click(screen.getByText("next"));
    expect(spies.useQuery.mock.calls.at(-1)?.[1]).toMatchObject({ cursor: "c2" });

    press("orders::resources.order.actions.cancel");
    expect(spies.run).toHaveBeenCalledWith(CancelOrderAction, { orderId: "ord_1" });

    fireEvent.click(screen.getByText("panel::resources.create"));
    expect(spies.navigate).toHaveBeenCalledWith(Orders.create, {});
    dispose();
  });

  it("offers view, edit and delete on a row and fans a bulk run out per record", async () => {
    const dispose = registerResources({
      "orders.order": {
        options: { area: ApiArea.Admin, operations: { list: true, delete: DeleteOrderAction } },
        actions: [{ kind: "run", action: CancelOrderAction, bulk: true }],
      },
    });
    spies.useQuery.mockReturnValue({
      data: { items: rows, hasMore: false },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    spies.run.mockResolvedValue({ status: "done", data: {} });
    render(<ResourceListPage resource={Orders} />);
    press("panel::resources.view", 1);
    expect(spies.navigate).toHaveBeenCalledWith(Orders.view, { id: "ord_2" });
    press("panel::resources.edit");
    expect(spies.navigate).toHaveBeenCalledWith(Orders.edit, { id: "ord_1" });

    fireEvent.click(screen.getByText("select"));
    const bulk = screen.getByRole("navigation");
    const first = bulk.querySelector("button");
    if (first === null) throw new Error("the bulk bar has no button");
    fireEvent.click(first);
    await vi.waitFor(() => expect(spies.run).toHaveBeenCalledTimes(2));
    expect(spies.run).toHaveBeenNthCalledWith(1, CancelOrderAction, { orderId: "ord_1" });
    expect(spies.run).toHaveBeenNthCalledWith(2, CancelOrderAction, { orderId: "ord_2" });
    expect(bulk.textContent).toContain("panel::resources.delete");
    dispose();
  });

  it("shows the row's own keys when no tree is registered", () => {
    spies.useQuery.mockReturnValue({
      data: { items: [{ id: "ord_1", status: "paid" }], hasMore: false },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    render(<ResourceListPage resource={Orders} />);
    expect(
      screen.getByText("orders::resources.order.columns.id|orders::resources.order.columns.status"),
    ).toBeTruthy();
    expect(spies.useQuery.mock.calls[0]?.[1]).toEqual({ limit: 25 });
  });
});
