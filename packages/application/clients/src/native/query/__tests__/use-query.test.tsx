/**
 * Stackra file contract:
 * Purpose: unit tests of the native `useQuery`: a cached answer under `[Query.key, input]` renders at once, nothing
 *          cached renders the pending state, and a container without a transport is refused, as on the react entry.
 * Boundary: test only; rendered to a string (no effect runs, so the app state subscription is covered by
 *           `focusFromAppState`'s own test), over a stand-in cache and the client fake as the transport, with
 *           `react-native` stubbed.
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
import { vi } from "vitest";
import { z } from "zod";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { queryRef } from "#core/functions/query-ref.function";
import { useQuery } from "#native/query/use-query";
import { ClientFake } from "#testing/client.fake";

vi.mock("react-native", () => ({
  AppState: { addEventListener: () => ({ remove: () => undefined }) },
}));

class ListOrdersQuery extends queryRef("orders.order.list@1", {
  input: z.object({ limit: z.number().int() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
}) {}

/** Prints the query's state. */
function Orders({ limit }: { readonly limit: number }) {
  const orders = useQuery(ListOrdersQuery, { limit });
  return <span>{orders.isPending ? "pending" : `orders:${orders.data?.items.length ?? 0}`}</span>;
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

describe("native useQuery", () => {
  it("renders the cached answer of its key", async () => {
    const client = new QueryClient();
    client.setQueryData(["orders.order.list@1", { limit: 25 }], { items: [{ id: "ord_1" }] });
    expect(await render(<Orders limit={25} />, client)).toContain("orders:1");
  });

  it("is pending while nothing is cached for its input", async () => {
    expect(await render(<Orders limit={10} />, new QueryClient())).toContain("pending");
  });

  it("needs a container that binds the transport", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Orders limit={25} />
        </ContainerProvider>,
      ),
    ).toThrow();
  });
});
