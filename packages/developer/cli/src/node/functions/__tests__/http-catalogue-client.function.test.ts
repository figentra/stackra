/**
 * Stackra file contract:
 * Purpose: unit tests of `httpCatalogueClient` over a fake fetch: the catalogue item path, null on 404, the licence
 *          token as a bearer, a tarball checked against its integrity, and a tarball outside the registry refused.
 * Boundary: test only; never reaches a network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 4, 8 and 12).
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { httpCatalogueClient } from "#node/functions/http-catalogue-client.function";

const ORIGIN = "https://registry.test/";
const item = {
  name: "@stackra/skill-archify",
  scope: "@stackra",
  kind: "skill",
  description: null,
  latest: "0.1.0",
  distTags: { latest: "0.1.0" },
  access: "open",
  licence: "Apache-2.0",
  keywords: [],
  repository: null,
  homepage: null,
  publishedAt: "2026-10-27T00:00:00.000Z",
  deprecated: null,
  stackra: { kind: "skill" },
};
const bytes = new Uint8Array([1, 2, 3]);
const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;

/** A fake fetch answering from `routes` by URL; records every call with all its arguments. */
const fakeFetch = (routes: Record<string, () => Response>) => {
  const calls: unknown[][] = [];
  const fetcher = (async (...args: Parameters<typeof fetch>) => {
    calls.push(args);
    const route = routes[String(args[0])];
    return route === undefined ? new Response(null, { status: 404 }) : route();
  }) as typeof fetch;
  return { calls, fetcher };
};

describe("httpCatalogueClient", () => {
  it("reads an item, null when missing, with the token as a bearer", async () => {
    const { calls, fetcher } = fakeFetch({
      [`${ORIGIN}-/stackra/v1/catalogue/@stackra/skill-archify`]: () => Response.json(item),
    });
    const client = httpCatalogueClient({ origin: ORIGIN, token: "stkl_x" }, fetcher);
    expect(await client.item("@stackra/skill-archify")).toEqual(item);
    expect(await client.item("@stackra/skill-none")).toBeNull();
    expect(calls[0]?.[1]).toEqual({ headers: { authorization: "Bearer stkl_x" } });
  });

  it("fetches a tarball and checks its integrity", async () => {
    const tarball = `${ORIGIN}@stackra/skill-archify/-/skill-archify-0.1.0.tgz`;
    const manifest = (sri: string) => () => Response.json({ dist: { tarball, integrity: sri } });
    const good = fakeFetch({
      [`${ORIGIN}@stackra/skill-archify/0.1.0`]: manifest(integrity),
      [tarball]: () => new Response(bytes),
    });
    const client = httpCatalogueClient({ origin: ORIGIN, token: undefined }, good.fetcher);
    expect(await client.tarball("@stackra/skill-archify", "0.1.0")).toEqual({ bytes, integrity });
    expect(good.calls[0]?.[1]).toEqual({ headers: {} });

    const bad = fakeFetch({
      [`${ORIGIN}@stackra/skill-archify/0.1.0`]: manifest("sha512-AAAA"),
      [tarball]: () => new Response(bytes),
    });
    await expect(
      httpCatalogueClient({ origin: ORIGIN, token: undefined }, bad.fetcher).tarball(
        "@stackra/skill-archify",
        "0.1.0",
      ),
    ).rejects.toThrow(/integrity/);
  });

  it("refuses a tarball outside the registry, so the token never leaves it", async () => {
    const { calls, fetcher } = fakeFetch({
      [`${ORIGIN}@stackra/skill-archify/0.1.0`]: () =>
        Response.json({ dist: { tarball: "https://elsewhere.test/a.tgz", integrity } }),
    });
    await expect(
      httpCatalogueClient({ origin: ORIGIN, token: "stkl_x" }, fetcher).tarball(
        "@stackra/skill-archify",
        "0.1.0",
      ),
    ).rejects.toThrow(/outside the registry/);
    expect(calls).toHaveLength(1);
  });
});
