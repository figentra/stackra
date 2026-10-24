/**
 * Stackra file contract:
 * Purpose: unit tests of `useQuery`: a cached answer under `[Query.key, input]` renders at once, nothing cached renders
 *          the pending state, and a container without a transport is refused.
 * Boundary: test only; rendered to a string (no DOM, so no effect runs and nothing is fetched), over a stand-in cache
 *           and the client fake as the transport.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0079 (TanStack Query core); ADR 0260 (decision 4).
 */
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ServerStateCache } from "@stackra/query";
import { describe, expect, it } from "@stackra/testing";
import { QueryClient } from "@tanstack/query-core";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { queryRef } from "#core/functions/query-ref.function";
import { useQuery } from "#react/query/use-query";
import { ClientFake } from "#testing/client.fake";

class OrderKpisQuery extends queryRef("orders.order.kpis@1", {
  input: z.object({ range: z.enum(["today", "this_month"]) }),
  output: z.object({ orders: z.number().int() }),
}) {}

/** Prints the query's state. */
function Kpis({ range }: { readonly range: "today" | "this_month" }) {
  const kpis = useQuery(OrderKpisQuery, { range });
  return <span>{kpis.isPending ? "pending" : `orders:${kpis.data?.orders ?? 0}`}</span>;
}

/** Renders `ui` under a container with a stand-in cache over `client`. */
async function render(ui: ReactNode, client: QueryClient): Promise<string> {
  const cache = Object.assign(Object.create(ServerStateCache.prototype) as ServerStateCache, {
    client,
    watch: () => () => undefined,
  });
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [ClientTransport, new ClientFake()],
      [ServerStateCache, cache],
    ]),
  });
  return renderToString(<ContainerProvider container={container}>{ui}</ContainerProvider>);
}

describe("useQuery", () => {
  it("renders the cached answer of its key", async () => {
    const client = new QueryClient();
    client.setQueryData(["orders.order.kpis@1", { range: "today" }], { orders: 7 });
    expect(await render(<Kpis range="today" />, client)).toContain("orders:7");
  });

  it("is pending while nothing is cached for its input", async () => {
    const client = new QueryClient();
    client.setQueryData(["orders.order.kpis@1", { range: "today" }], { orders: 7 });
    expect(await render(<Kpis range="this_month" />, client)).toContain("pending");
  });

  it("needs a container that binds the transport", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Kpis range="today" />
        </ContainerProvider>,
      ),
    ).toThrow();
  });
});
