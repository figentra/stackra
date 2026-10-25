/**
 * Stackra file contract:
 * Purpose: unit tests of `useQueryClient`: `fetch` goes through the transport once and then answers from the cache under
 *          the query's key, a refusal rejects, and `invalidate` marks the query's results stale by its key or by key
 *          and input.
 * Boundary: test only; the hook's object is taken from a string render and used after it, over the client fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0079 (TanStack Query core).
 */
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { isRefusal } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { ServerStateCache } from "@stackra/query";
import { describe, expect, it } from "@stackra/testing";
import { QueryClient } from "@tanstack/query-core";
import { renderToString } from "react-dom/server";
import { vi } from "vitest";
import { z } from "zod";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { queryRef } from "#core/functions/query-ref.function";
import { refusalRef } from "#core/functions/refusal-ref.function";
import type { ClientQueries } from "#react/query-client/client-queries.type";
import { useQueryClient } from "#react/query-client/use-query-client";
import { ClientFake } from "#testing/client.fake";

class GetVariantByBarcodeQuery extends queryRef("catalogue.variant.get_by_barcode@1", {
  input: z.object({ barcode: z.string() }),
  output: z.object({ variantId: z.string() }),
}) {}

class VariantNotFoundError extends refusalRef("catalogue.variant_not_found") {}

/** Hands the hook's object to `report`. */
function Probe({ report }: { readonly report: (queries: ClientQueries) => void }) {
  report(useQueryClient());
  return null;
}

/** The hook's object for a container over `fake` and `client`. */
async function queriesOf(fake: ClientFake, client: QueryClient): Promise<ClientQueries> {
  const cache = Object.assign(Object.create(ServerStateCache.prototype) as ServerStateCache, {
    client,
    watch: () => () => undefined,
  });
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [ClientTransport, fake],
      [ServerStateCache, cache],
    ]),
  });
  let queries: ClientQueries | undefined;
  renderToString(
    <ContainerProvider container={container}>
      <Probe
        report={(value) => {
          queries = value;
        }}
      />
    </ContainerProvider>,
  );
  if (queries === undefined) throw new Error("the probe did not render");
  return queries;
}

describe("useQueryClient", () => {
  it("fetches through the transport, then answers from the cache", async () => {
    const fake = new ClientFake();
    fake.on(GetVariantByBarcodeQuery).returns({ variantId: "var_1" });
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    const queries = await queriesOf(fake, client);
    expect(await queries.fetch(GetVariantByBarcodeQuery, { barcode: "62810" })).toEqual({
      variantId: "var_1",
    });
    await queries.fetch(GetVariantByBarcodeQuery, { barcode: "62810" });
    expect(fake.called(GetVariantByBarcodeQuery)).toEqual([{ barcode: "62810" }]);
    expect(
      client.getQueryData(["catalogue.variant.get_by_barcode@1", { barcode: "62810" }]),
    ).toEqual({ variantId: "var_1" });
  });

  it("rejects with the producer's refusal", async () => {
    const fake = new ClientFake();
    fake.on(GetVariantByBarcodeQuery).throws(refusal(VariantNotFoundError));
    const queries = await queriesOf(
      fake,
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );
    await expect(queries.fetch(GetVariantByBarcodeQuery, { barcode: "0" })).rejects.toSatisfy(
      (error) => isRefusal(error, VariantNotFoundError),
    );
  });

  it("invalidates by the query's key, or by key and input", async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const queries = await queriesOf(new ClientFake(), client);
    await queries.invalidate(GetVariantByBarcodeQuery);
    await queries.invalidate(GetVariantByBarcodeQuery, { barcode: "62810" });
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      ["catalogue.variant.get_by_barcode@1"],
      ["catalogue.variant.get_by_barcode@1", { barcode: "62810" }],
    ]);
  });
});
