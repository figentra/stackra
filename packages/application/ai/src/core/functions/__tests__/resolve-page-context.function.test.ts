/**
 * Stackra file contract:
 * Purpose: unit tests of `resolvePageContext`: the page's record and the selection load through the facts lookup and are
 *          cut to the data class's allow-list, an id whose lookup refuses or that no `Facts` class serves is dropped, and
 *          the records stop at the token budget with the rest counted as omitted.
 * Boundary: test only; the lookup is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0490 (decision 6); ADR 0360 (decision 15); STA-1631.
 */
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { resolvePageContext } from "#core/functions/resolve-page-context.function";
import type { PageContext } from "#core/schemas/page-context.schema";
import type { PageContextSources } from "#core/types/page-context-sources.type";

const A = "ord_01h2j3k4l5m6n7p8q9r0s1t2v3";
const B = "ord_01h2j3k4l5m6n7p8q9r0s1t2v4";
const SECRET = "ord_01h2j3k4l5m6n7p8q9r0s1t2v5";
const NO_FACTS = "tkt_01h2j3k4l5m6n7p8q9r0s1t2v6";

const context = (extra: Partial<PageContext> = {}): PageContext =>
  ({ app: "console", route: "order_detail", params: { orderId: A }, ...extra }) as PageContext;

const sources = (budgetTokens = 1000): PageContextSources => ({
  allowList: { order: ["status"] },
  budgetTokens,
  provide: async (id) => {
    if (id === SECRET) throw ForbiddenError.create();
    if (id === NO_FACTS) return undefined;
    return {
      dataClass: "order",
      facts: { summary: `Order ${id} is open.`, facts: { status: "open", email: "a@b.c" } },
    };
  },
});

describe(resolvePageContext, () => {
  it("loads the record and keeps only the allow-listed fields", async () => {
    const seen = await resolvePageContext(context({ record: A }), sources());
    expect(seen.records).toEqual([
      { id: A, summary: `Order ${A} is open.`, facts: { status: "open" } },
    ]);
    expect(seen).toMatchObject({ app: "console", route: "order_detail", omitted: 0 });
  });

  it("drops the ids the caller cannot read or no Facts class serves", async () => {
    const seen = await resolvePageContext(
      context({ selection: { ids: [A, SECRET, NO_FACTS, B], count: 4 } as never }),
      sources(),
    );
    expect(seen.records.map((record) => record.id)).toEqual([A, B]);
    expect(seen.selection).toEqual({ count: 4, ids: [A, B], dropped: 2 });
  });

  it("stops at the token budget and counts the rest as omitted", async () => {
    const seen = await resolvePageContext(
      context({ record: A, selection: { ids: [A, B], count: 2 } as never }),
      sources(30),
    );
    expect(seen.records.length).toBeLessThan(2);
    expect(seen.omitted + seen.records.length).toBe(2);
    expect(seen.selection?.ids).toEqual([A, B]);
  });

  it("passes the filters, view and modal keys through", async () => {
    const seen = await resolvePageContext(
      context({
        filters: { status: "open" },
        view: "mine",
        modal: { action: "orders.order.cancel", fields: ["reason"] } as never,
      }),
      sources(),
    );
    expect(seen).toMatchObject({
      filters: { status: "open" },
      view: "mine",
      modal: { action: "orders.order.cancel", fields: ["reason"] },
      records: [],
    });
  });
});
