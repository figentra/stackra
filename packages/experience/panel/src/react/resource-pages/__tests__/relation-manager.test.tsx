/**
 * Stackra file contract:
 * Purpose: unit tests of `RelationManager`: the related list query read with its input bound from the record and the
 *          page size, under the related model's derived title.
 * Boundary: unit tier, jsdom; `useQuery` is a spy, the web kit is DOM stand-ins, translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307; ADR 0164.
 */
// @vitest-environment jsdom
import { queryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import { RelationManager } from "#react/resource-pages/relation-manager";

const spies = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@stackra/clients/react", () => ({ useQuery: spies.useQuery }));
vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
}));
vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
  type Props = Record<string, any>;
  return {
    Section: (props: Props) => createElement("section", null, props.title, props.children),
    EmptyState: (props: Props) => createElement("p", null, props.title),
    FilterBar: () => null,
    DataTable: (props: Props) =>
      createElement(
        "table",
        null,
        props.items.map((item: Props) => createElement("tr", { key: item.id }, item.id)),
      ),
  };
});

const ListOrderLinesQuery = queryRef("orders.order_line.list@1", {
  input: z.object({ orderId: z.string(), limit: z.number() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
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
});
