/**
 * Stackra file contract:
 * Purpose: unit tests of `useReplica`: a screen reads `{ data, asOf }` from the bound `ReplicaStore` (empty with
 *          `asOf: null` before the first fill), and the hook throws outside a `ContainerProvider`, without a bound store
 *          and for a query not declared a replica.
 * Boundary: test only; renders on the server with a container that binds a store stand-in answering a fixed snapshot.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 3).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { ReplicaStore } from "#core/index";
import type { ReplicaRef } from "#core/index";
import type { ReplicaSnapshot } from "#core/types/replica-snapshot.type";
import { useReplica } from "#react/replica/use-replica";

/** A replica query, as a generated class reads by its statics. */
const RecentSalesQuery: ReplicaRef = {
  key: "sales.sale.recent@1",
  replica: { of: "sales.sale", window: "30d", limit: 50 },
};

const AS_OF = new Date("2026-10-24T09:00:00.000Z");

/** A store stand-in that answers `snapshot` for a replica and refuses any other query, as the real one does. */
function storeOf(snapshot: ReplicaSnapshot): ReplicaStore {
  return Object.assign(Object.create(ReplicaStore.prototype) as ReplicaStore, {
    subscribe: () => () => undefined,
    version: () => 1,
    read: (query: ReplicaRef) => {
      if (query.key !== RecentSalesQuery.key) throw new TypeError(`${query.key} is not a replica`);
      return snapshot;
    },
  });
}

/** Renders how many sales the replica holds and how old it is. */
function SalesLine({ query = RecentSalesQuery }: { readonly query?: ReplicaRef }) {
  const { data, asOf } = useReplica(query);
  return <span>{`${data.length} sales as of ${asOf?.toISOString() ?? "never"}`}</span>;
}

/** Renders `<SalesLine />` in a container that binds `store`. */
async function renderWith(store: ReplicaStore, query?: ReplicaRef): Promise<string> {
  const container = await Container.create([], { overrides: new Map([[ReplicaStore, store]]) });
  return renderToString(
    <ContainerProvider container={container}>
      <SalesLine {...(query === undefined ? {} : { query })} />
    </ContainerProvider>,
  );
}

describe("useReplica", () => {
  it("reads the replica and its as-of time from the bound store", async () => {
    expect(await renderWith(storeOf({ data: [{ id: "sal_1" }], asOf: AS_OF }))).toBe(
      `<span>1 sales as of ${AS_OF.toISOString()}</span>`,
    );
    expect(await renderWith(storeOf({ data: [], asOf: null }))).toBe(
      "<span>0 sales as of never</span>",
    );
    expectTypeOf(useReplica).returns.toEqualTypeOf<ReplicaSnapshot>();
  });

  it("throws for a query not declared a replica", async () => {
    const other = { key: "orders.order.list@1", replica: RecentSalesQuery.replica };
    await expect(renderWith(storeOf({ data: [], asOf: null }), other)).rejects.toThrow(TypeError);
  });

  it("throws outside a ContainerProvider and without a bound store", async () => {
    expect(() => renderToString(<SalesLine />)).toThrow(/ContainerProvider/);
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <SalesLine />
        </ContainerProvider>,
      ),
    ).toThrow(/ReplicaStore/);
  });
});
