/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpEmbedderDriver`: it posts the model and texts to `<url>/embeddings` with the token from
 *          the named variable, returns vectors in input order, batches long inputs, and refuses a missing endpoint, an
 *          unset token variable, an error status and a vector of the wrong size.
 * Boundary: test only; `fetch` is replaced, so no request leaves the process; the token is a test value set through
 *           the environment for the test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0354.
 */
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SearchConfig } from "#config/search.config";
import { Embedder } from "#contracts/ports/embedder.port";
import { HttpEmbedderDriver } from "#node/drivers/http-embedder.driver";

/** An embedder over the test endpoint with vectors of `dimensions`. */
function embedder(tokenEnv: string | null = null, dimensions = 2): HttpEmbedderDriver {
  return new HttpEmbedderDriver(
    buildConfig(SearchConfig, {
      values: { embedder: { url: "https://embed.test/v1/", model: "e5", dimensions, tokenEnv } },
    }),
  );
}

/** Replaces `fetch` with an endpoint that answers each input with `[index, length]`, in reverse order. */
function endpoint(status = 200) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
    const { input } = JSON.parse(String(init?.body)) as { input: string[] };
    const data = input.map((text, index) => ({ index, embedding: [index, text.length] })).reverse();
    return new Response(JSON.stringify({ data }), { status });
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("HttpEmbedderDriver", () => {
  it("embeds through the endpoint in input order, with the token", async () => {
    vi.stubEnv("STACKRA_TEST_EMBEDDER_TOKEN", "test-only-token");
    const fetch = endpoint();
    const driver = embedder("STACKRA_TEST_EMBEDDER_TOKEN");
    expect(driver).toBeInstanceOf(Embedder);
    expect(driver.dimensions).toBe(2);
    expect(await driver.embed(["linen", "قميص"])).toEqual([
      [0, 5],
      [1, 4],
    ]);
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe("https://embed.test/v1/embeddings");
    expect(init?.headers).toMatchObject({ authorization: "Bearer test-only-token" });
    expect(JSON.parse(String(init?.body))).toEqual({ model: "e5", input: ["linen", "قميص"] });
  });

  it("batches a long input", async () => {
    const fetch = endpoint();
    const vectors = await embedder().embed(Array.from({ length: 100 }, () => "x"));
    expect(vectors).toHaveLength(100);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("refuses what it cannot use", async () => {
    expect(() => new HttpEmbedderDriver(buildConfig(SearchConfig))).toThrow(/search\.embedder/);
    await expect(embedder("STACKRA_TEST_UNSET_TOKEN").embed(["x"])).rejects.toThrow(/not set/);
    endpoint(503);
    await expect(embedder().embed(["x"])).rejects.toThrow(/503/);
    vi.restoreAllMocks();
    endpoint();
    await expect(embedder(null, 3).embed(["x"])).rejects.toThrow(RangeError);
  });
});
