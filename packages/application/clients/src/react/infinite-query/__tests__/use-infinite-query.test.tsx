/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useInfiniteQuery`: cached pages render in order with whether a next page exists
 *          (read from `hasMore` and `nextCursor` by default), and the page type follows the query's output.
 * Boundary: test only; rendered to a string (no DOM, so nothing is fetched), over a stand-in cache.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0079 (TanStack Query core); the HTTP conventions rule (cursor pagination).
 */
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ServerStateCache } from "@stackra/query";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { QueryClient } from "@tanstack/query-core";
import { renderToString } from "react-dom/server";
import { z } from "zod";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { queryRef } from "#core/functions/query-ref.function";
import { useInfiniteQuery } from "#react/infinite-query/use-infinite-query";
import type { UseInfiniteQueryResult } from "#react/infinite-query/use-infinite-query-result.type";
import { ClientFake } from "#testing/client.fake";

const Page$ = z.object({
  items: z.array(z.object({ id: z.string() })),
  nextCursor: z.string().exactOptional(),
  hasMore: z.boolean(),
});

class ListInboxMessagesQuery extends queryRef("messages.inbox_message.list@1", {
  input: z.object({ cursor: z.string().exactOptional(), limit: z.number().int().default(20) }),
  output: Page$,
}) {}

/** Prints the loaded ids and whether more exist. */
function Inbox() {
  const inbox = useInfiniteQuery(ListInboxMessagesQuery, { limit: 2 });
  const ids = inbox.pages.flatMap((page) => page.items.map((item) => item.id));
  return <span>{`${ids.join(",")}|${inbox.hasNextPage ? "more" : "end"}`}</span>;
}

describe("useInfiniteQuery", () => {
  it("renders the cached pages and whether a next page exists", async () => {
    const client = new QueryClient();
    client.setQueryData(["messages.inbox_message.list@1", { limit: 2 }, "pages"], {
      pages: [{ items: [{ id: "a" }, { id: "b" }], nextCursor: "c2", hasMore: true }],
      pageParams: [undefined],
    });
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
    const html = renderToString(
      <ContainerProvider container={container}>
        <Inbox />
      </ContainerProvider>,
    );
    expect(html).toContain("a,b|more");
  });

  it("types its pages by the query's output", () => {
    expectTypeOf<
      ReturnType<typeof useInfiniteQuery<typeof ListInboxMessagesQuery>>
    >().toEqualTypeOf<UseInfiniteQueryResult<z.output<typeof Page$>>>();
  });
});
