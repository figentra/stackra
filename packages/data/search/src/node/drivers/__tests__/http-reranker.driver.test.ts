/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpRerankerDriver`: it passes the reranker conformance suite over a replaced `fetch`, posts
 *          `{ query, texts }` to `<url>/rerank` with the token read from the runtime secret store under the configured
 *          name, maps `[{ index, score }]` back to candidate ids best first, and refuses a missing endpoint, an unbound
 *          token secret, an error status, an unknown index and a bad score; it never reads the environment.
 * Boundary: test only; `fetch` is replaced, so no request leaves the process; the token is a test value held by a
 *           stand-in `SecretStore`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0089 (decision 5); ADR 0492 (decision 4); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SearchConfig } from "#config/search.config";
import { Reranker } from "#contracts/ports/reranker.port";
import { HttpRerankerDriver } from "#node/drivers/http-reranker.driver";
import { runRerankerConformance } from "#testing/run-reranker-conformance.function";

/** A secret store holding `values`. */
function storeOf(values: Readonly<Record<string, string>>): SecretStore {
  return Object.assign(Object.create(SecretStore.prototype) as SecretStore, {
    get: (name: string) => values[name],
  });
}

/** The test store: one bound token. */
const SECRETS = storeOf({ SEARCH_RERANKER_TOKEN: "test-only-token" });

/** A reranker over the test endpoint. */
function reranker(tokenSecret: string | null = null, topN = 50): HttpRerankerDriver {
  return new HttpRerankerDriver(
    buildConfig(SearchConfig, {
      values: { reranker: { url: "https://rerank.test/", tokenSecret, topN } },
    }),
    SECRETS,
  );
}

/** Replaces `fetch` with an endpoint scoring each text by its length, in reverse order of index. */
function endpoint(status = 200, reply?: unknown) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
    const { texts } = JSON.parse(String(init?.body)) as { texts: string[] };
    const scored = texts.map((text, index) => ({ index, score: text.length })).reverse();
    return new Response(JSON.stringify(reply ?? scored), { status });
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("HttpRerankerDriver", () => {
  it("passes the Reranker conformance suite", async () => {
    endpoint();
    expect(await runRerankerConformance(() => reranker())).toEqual([]);
  });

  it("posts the query and texts with the token from the secret store and returns ids best first", async () => {
    const fetch = endpoint();
    const driver = reranker("SEARCH_RERANKER_TOKEN", 20);
    expect(driver).toBeInstanceOf(Reranker);
    expect(driver.topN).toBe(20);
    expect(
      await driver.rerank(
        "shirt",
        [
          { id: "a", text: "x" },
          { id: "b", text: "xxx" },
        ],
        1,
      ),
    ).toEqual([{ id: "b", score: 3 }]);
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe("https://rerank.test/rerank");
    expect(init?.headers).toMatchObject({ authorization: "Bearer test-only-token" });
    expect(JSON.parse(String(init?.body))).toEqual({ query: "shirt", texts: ["x", "xxx"] });
  });

  it("never reads the token from the environment, and sends none when none is configured", async () => {
    vi.stubEnv("STACKRA_TEST_RERANKER_TOKEN", "from-the-environment");
    const fetch = endpoint();
    await expect(
      reranker("STACKRA_TEST_RERANKER_TOKEN").rerank("q", [{ id: "a", text: "x" }], 1),
    ).rejects.toThrow(/not bound/);
    await reranker().rerank("q", [{ id: "a", text: "x" }], 1);
    expect(fetch.mock.calls[0]?.[1]?.headers).not.toHaveProperty("authorization");
  });

  it("refuses what it cannot use", async () => {
    expect(() => new HttpRerankerDriver(buildConfig(SearchConfig), SECRETS)).toThrow(
      /search\.reranker/,
    );
    const one = [{ id: "a", text: "x" }];
    endpoint(503);
    await expect(reranker().rerank("q", one, 1)).rejects.toThrow(/503/);
    vi.restoreAllMocks();
    endpoint(200, [{ index: 9, score: 1 }]);
    await expect(reranker().rerank("q", one, 1)).rejects.toThrow(RangeError);
    vi.restoreAllMocks();
    endpoint(200, [{ index: 0, score: "high" }]);
    await expect(reranker().rerank("q", one, 1)).rejects.toThrow(RangeError);
  });
});
