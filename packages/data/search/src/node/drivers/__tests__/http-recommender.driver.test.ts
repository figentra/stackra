/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpRecommenderDriver`: it posts `{ tenant, item, kind, limit }` to `<url>/recommend` with the token
 *          read from the runtime secret store, returns `[{ id, score }]` without the item itself and cut at the limit, and
 *          refuses a missing endpoint, a call with no scope, a bad limit, an unbound token secret, an error status and a
 *          malformed answer; it never reads the environment.
 * Boundary: test only; `fetch` is replaced, so no request leaves the process; the token is a test value held by a
 *           stand-in `SecretStore`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 8); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SearchConfig } from "#config/search.config";
import { Recommender } from "#contracts/ports/recommender.port";
import { HttpRecommenderDriver } from "#node/drivers/http-recommender.driver";

/** A secret store holding `values`. */
function storeOf(values: Readonly<Record<string, string>>): SecretStore {
  return Object.assign(Object.create(SecretStore.prototype) as SecretStore, {
    get: (name: string) => values[name],
  });
}

const SCOPE: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w3", path: "acme" };

const SECRETS = storeOf({ SEARCH_RECOMMENDER_TOKEN: "test-only-token" });

/** A recommender over the test endpoint. */
function recommender(tokenSecret: string | null = null): HttpRecommenderDriver {
  return new HttpRecommenderDriver(
    buildConfig(SearchConfig, {
      values: {
        recommender: { url: "https://recommend.test/", tokenSecret, limit: 2, cooccurrence: null },
      },
    }),
    SECRETS,
  );
}

/** Replaces `fetch` with an endpoint answering `reply`. */
function endpoint(
  status = 200,
  reply: unknown = [
    { id: "p1", score: 3 },
    { id: "p2", score: 2 },
    { id: "p3", score: 1 },
  ],
) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(JSON.stringify(reply), { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("HttpRecommenderDriver", () => {
  it("posts the tenant, item and kind with the token, and cuts at the default limit", async () => {
    const fetch = endpoint();
    const driver = recommender("SEARCH_RECOMMENDER_TOKEN");
    expect(driver).toBeInstanceOf(Recommender);
    expect(await driver.similar("p0", { scope: SCOPE })).toEqual([
      { id: "p1", score: 3 },
      { id: "p2", score: 2 },
    ]);
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe("https://recommend.test/recommend");
    expect(init?.headers).toMatchObject({ authorization: "Bearer test-only-token" });
    expect(JSON.parse(String(init?.body))).toEqual({
      tenant: SCOPE.id,
      item: "p0",
      kind: "similar",
      limit: 2,
    });
  });

  it("asks for bought-together, drops the item itself and takes the call's limit", async () => {
    const fetch = endpoint(200, [
      { id: "p0", score: 9 },
      { id: "p1", score: 3 },
    ]);
    expect(await recommender().boughtTogether("p0", { scope: SCOPE, limit: 5 })).toEqual([
      { id: "p1", score: 3 },
    ]);
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toMatchObject({
      kind: "bought_together",
      limit: 5,
    });
    expect(fetch.mock.calls[0]?.[1]?.headers).not.toHaveProperty("authorization");
  });

  it("never reads the token from the environment", async () => {
    vi.stubEnv("STACKRA_TEST_RECOMMENDER_TOKEN", "from-the-environment");
    endpoint();
    await expect(
      recommender("STACKRA_TEST_RECOMMENDER_TOKEN").similar("p0", { scope: SCOPE }),
    ).rejects.toThrow(/not bound/);
  });

  it("refuses what it cannot use", async () => {
    expect(() => new HttpRecommenderDriver(buildConfig(SearchConfig), SECRETS)).toThrow(
      /search\.recommender/,
    );
    endpoint();
    await expect(recommender().similar("p0")).rejects.toThrow(TypeError);
    await expect(recommender().similar("p0", { scope: SCOPE, limit: 0 })).rejects.toThrow(
      RangeError,
    );
    vi.restoreAllMocks();
    endpoint(503);
    await expect(recommender().similar("p0", { scope: SCOPE })).rejects.toThrow(/503/);
    vi.restoreAllMocks();
    endpoint(200, [{ id: 1, score: "x" }]);
    await expect(recommender().similar("p0", { scope: SCOPE })).rejects.toThrow(RangeError);
  });
});
