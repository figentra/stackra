/**
 * Stackra file contract:
 * Purpose: unit tests of `ResourceViewPage`: the get query read with the record id under its input key, the recorded
 *          entries and sections, the header actions (edit, a placed record action run with the id, delete), the
 *          relation managers with their bound input, the derived entries without a tree, a list entry's minor units as
 *          money in the item's or the record's currency, and the error state.
 * Boundary: unit tier, jsdom; `useQuery`, the action runner and navigation are spies, the relation manager and the web
 *           kit are DOM stand-ins, translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 3 and 4); ADR 0164.
 */
// @vitest-environment jsdom
import { actionRef, queryRef } from "@stackra/clients";
import { ApiArea } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import { registerResources } from "#core/functions/register-resources.function";
import { resource } from "#core/functions/resource.function";
import { ResourceViewPage } from "#react/resource-pages/resource-view-page";

const spies = vi.hoisted(() => ({
  useQuery: vi.fn(),
  run: vi.fn(),
  navigate: vi.fn(),
  related: [] as unknown[],
}));

vi.mock("@stackra/clients/react", () => ({ useQuery: spies.useQuery }));
vi.mock("#react/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("@stackra/navigation/react", () => ({ useNavigate: () => spies.navigate }));
vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
}));
vi.mock("#react/resource-pages/relation-manager", () => ({
  RelationManager: (props: unknown) => {
    spies.related.push(props);
    return null;
  },
}));

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
  type Props = Record<string, any>;
  return {
    PageSkeleton: () => createElement("p", null, "loading"),
    ErrorState: (props: Props) => createElement("p", null, props.title),
    Section: (props: Props) => createElement("section", null, props.title, props.children),
    Table: (props: Props) =>
      createElement(
        "table",
        { "aria-label": props.label },
        createElement(
          "tbody",
          null,
          props.items.map((item: Props) =>
            createElement(
              "tr",
              { key: item.id },
              props.columns.map((column: Props) =>
                createElement("td", { key: column.id }, props.renderCell(item, column)),
              ),
            ),
          ),
        ),
      ),
    PropertyList: (props: Props) =>
      createElement(
        "dl",
        null,
        props.items.map((item: Props) =>
          createElement(
            "div",
            { key: item.id },
            createElement("dt", null, item.label),
            createElement("dd", null, item.value),
          ),
        ),
      ),
    PageHeader: (props: Props) =>
      createElement(
        "header",
        null,
        props.title,
        props.actions.map((action: Props) =>
          createElement(
            "button",
            { type: "button", key: action.id, onClick: () => action.onPress?.() },
            action.label,
          ),
        ),
      ),
  };
});

const ListOrderLinesQuery = queryRef("orders.order_line.list@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
});
const GetOrderQuery = queryRef("orders.order.get@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ id: z.string() }),
});
const UpdateOrderAction = actionRef("orders.order.update@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({}),
});
const CancelOrderAction = actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({}),
});

const Orders = resource("orders.order", {
  base: "/orders/orders",
  view: GetOrderQuery,
  update: UpdateOrderAction,
});

const order = { id: "ord_1", status: "paid", totals: { totalMinor: 500, currency: "SAR" } };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  spies.related.length = 0;
});

describe("ResourceViewPage", () => {
  it("draws the recorded entries, the header actions and the relations", () => {
    const relation = {
      kind: "table" as const,
      query: ListOrderLinesQuery,
      columns: [],
      bind: { orderId: "record.id" },
    };
    const dispose = registerResources({
      "orders.order": {
        options: { area: ApiArea.Admin, operations: { get: true } },
        infolist: {
          entries: [
            { kind: "value", key: "status" },
            {
              kind: "section",
              name: "totals",
              entries: [{ kind: "money", key: "totals.totalMinor", currency: "totals.currency" }],
            },
          ],
        },
        relations: [relation],
        actions: [{ kind: "run", action: CancelOrderAction }],
      },
    });
    spies.useQuery.mockReturnValue({
      data: order,
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    render(<ResourceViewPage resource={Orders} id="ord_1" />);
    expect(spies.useQuery).toHaveBeenCalledWith(GetOrderQuery, { orderId: "ord_1" });
    expect(screen.getByText("orders::resources.order.entries.status")).toBeTruthy();
    expect(screen.getByText("orders::resources.order.sections.totals")).toBeTruthy();
    expect(screen.getByText("SAR 500")).toBeTruthy();

    fireEvent.click(screen.getByText("panel::resources.edit"));
    expect(spies.navigate).toHaveBeenCalledWith(Orders.edit, { id: "ord_1" });
    fireEvent.click(screen.getByText("orders::resources.order.actions.cancel"));
    expect(spies.run).toHaveBeenCalledWith(CancelOrderAction, { orderId: "ord_1" });

    expect(spies.related[0]).toMatchObject({
      resourceKey: "orders.order",
      relation,
      record: order,
    });
    dispose();
  });

  it("shows the record's own keys without a tree, and the error state on a failed read", () => {
    spies.useQuery.mockReturnValue({
      data: order,
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    render(<ResourceViewPage resource={Orders} id="ord_1" />);
    expect(screen.getByText("orders::resources.order.entries.totals")).toBeTruthy();
    cleanup();

    spies.useQuery.mockReturnValue({
      data: undefined,
      error: new Error("boom"),
      isPending: false,
      refetch: vi.fn(),
    });
    render(<ResourceViewPage resource={Orders} id="ord_1" />);
    expect(screen.getByText("panel::resources.failed")).toBeTruthy();
  });

  it("draws a list entry's minor units as money in the item's own currency, else the record's", () => {
    const dispose = registerResources({
      "orders.order": {
        options: { area: ApiArea.Admin, operations: { get: true } },
        infolist: {
          entries: [
            { kind: "list", key: "customs", columns: ["sku", "valueMinor"], currency: "currency" },
          ],
        },
      },
    });
    spies.useQuery.mockReturnValue({
      data: {
        id: "ord_1",
        currency: "SAR",
        customs: [
          { sku: "SKU-1", valueMinor: 1250 },
          { sku: "SKU-2", valueMinor: 99, currency: "EUR" },
        ],
      },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    render(<ResourceViewPage resource={Orders} id="ord_1" />);
    expect(screen.getByText("SKU-1")).toBeTruthy();
    expect(screen.getByText("SAR 1250")).toBeTruthy();
    expect(screen.getByText("EUR 99")).toBeTruthy();
    dispose();
  });
});
