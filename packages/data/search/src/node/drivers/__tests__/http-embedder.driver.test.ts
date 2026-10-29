/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpEmbedderDriver`: it posts the model and texts to `<url>/embeddings` with the token read
 *          from the runtime secret store under the configured secret name, returns vectors in input order, batches long
 *          inputs, and refuses a missing endpoint, an unbound token secret, an error status and a vector of the wrong
 *          size; it never reads the environment.
 * Boundary: test only; `fetch` is replaced, so no request leaves the process; the token is a test value held by a
 *           stand-in `SecretStore`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0354; ADR 0173; ADR 0404.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SearchConfig } from "#config/search.config";
import { Embedder } from "#contracts/ports/embedder.port";
import { HttpEmbedderDriver } from "#node/drivers/http-embedder.driver";

/** A secret store holding `values`. */
function storeOf(values: Readonly<Record<string, string>>): SecretStore {
  return Object.assign(Object.create(SecretStore.prototype) as SecretStore, {
    get: (name: string) => values[name],
  });
}

/** The test store: one bound token. */
const SECRETS = storeOf({ SEARCH_EMBEDDER_TOKEN: "test-only-token" });

/** An embedder over the test endpoint with vectors of `dimensions`. */
function embedder(tokenSecret: string | null = null, dimensions = 2): HttpEmbedderDriver {
  return new HttpEmbedderDriver(
    buildConfig(SearchConfig, {
      values: {
        embedder: {
          url: "https://embed.test/v1/",
          model: "e5",
          dimensions,
          tokenSecret,
          passageCharacters: 2000,
          passageOverlap: 200,
        },
      },
    }),
    SECRETS,
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
  it("embeds through the endpoint in input order, with the token from the secret store", async () => {
    const fetch = endpoint();
    const driver = embedder("SEARCH_EMBEDDER_TOKEN");
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

  it("never reads the token from the environment", async () => {
    vi.stubEnv("STACKRA_TEST_EMBEDDER_TOKEN", "from-the-environment");
    endpoint();
    await expect(embedder("STACKRA_TEST_EMBEDDER_TOKEN").embed(["x"])).rejects.toThrow(/not bound/);
  });

  it("sends no token when none is configured", async () => {
    const fetch = endpoint();
    await embedder().embed(["x"]);
    expect(fetch.mock.calls[0]?.[1]?.headers).not.toHaveProperty("authorization");
  });

  it("batches a long input", async () => {
    const fetch = endpoint();
    const vectors = await embedder().embed(Array.from({ length: 100 }, () => "x"));
    expect(vectors).toHaveLength(100);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("refuses what it cannot use", async () => {
    expect(() => new HttpEmbedderDriver(buildConfig(SearchConfig), SECRETS)).toThrow(
      /search\.embedder/,
    );
    await expect(embedder("SEARCH_UNBOUND_TOKEN").embed(["x"])).rejects.toThrow(/not bound/);
    endpoint(503);
    await expect(embedder().embed(["x"])).rejects.toThrow(/503/);
    vi.restoreAllMocks();
    endpoint();
    await expect(embedder(null, 3).embed(["x"])).rejects.toThrow(RangeError);
  });
});
