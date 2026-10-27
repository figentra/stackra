/**
 * Stackra file contract:
 * Purpose: unit tests of `defineQueryDevtools`: the `query.cache` tab lists cached queries by versioned key without
 *          input or data, the `query.mutations` tab is sensitive and reads the queue's state, and the remover removes
 *          both tabs.
 * Boundary: test only; a recording fake stands in for `DevtoolsKit`, a bare TanStack `QueryClient` for the cache and a
 *           plain object for the queue's read-only state.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0246 (decision 4).
 */
import type { DevtoolsTabSink, DevtoolsTabSinkDefinition } from "@stackra/container/devtools";
import { describe, expect, it } from "@stackra/testing";
import { QueryClient } from "@tanstack/query-core";

import type { ConflictRecord } from "#core/types/conflict-record.type";
import type { PendingMutation } from "#core/types/pending-mutation.type";
import { defineQueryDevtools } from "#devtools/functions/define-query-devtools.function";

/** A kit fake that records every defined tab and every removal. */
function fakeKit(): DevtoolsTabSink & {
  readonly tabs: Map<string, DevtoolsTabSinkDefinition>;
  readonly removed: string[];
} {
  const tabs = new Map<string, DevtoolsTabSinkDefinition>();
  const removed: string[] = [];
  return {
    tabs,
    removed,
    defineTab: (definition) => {
      tabs.set(definition.id, definition);
      return () => {
        removed.push(definition.id);
      };
    },
  };
}

const queue = {
  items: [] as readonly PendingMutation[],
  conflicts: [] as readonly ConflictRecord[],
  pending: 0,
  isDraining: false,
};

describe("defineQueryDevtools", () => {
  it("lists cached queries by their versioned key, without input or data", () => {
    const client = new QueryClient();
    client.setQueryData(["orders.order.get@1", { orderId: "ord_secret" }], { total: 42 });
    const kit = fakeKit();
    defineQueryDevtools(kit, { client }, queue);
    const tab = kit.tabs.get("query.cache");
    expect(tab?.sensitive).toBeUndefined();
    const rows = tab?.read() as readonly Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      query: "orders.order.get@1",
      status: "success",
      fetchStatus: "idle",
      observers: 0,
    });
    expect(JSON.stringify(rows)).not.toContain("ord_secret");
  });

  it("marks the mutations tab sensitive and reads the queue's state", () => {
    const kit = fakeKit();
    defineQueryDevtools(
      kit,
      { client: new QueryClient() },
      { ...queue, pending: 2, isDraining: true },
    );
    const tab = kit.tabs.get("query.mutations");
    expect(tab?.sensitive).toBe(true);
    expect(tab?.read()).toEqual({ pending: 2, draining: true, items: [], conflicts: [] });
  });

  it("removes both tabs", () => {
    const kit = fakeKit();
    defineQueryDevtools(kit, { client: new QueryClient() }, queue)();
    expect(kit.removed).toEqual(["query.cache", "query.mutations"]);
  });
});
