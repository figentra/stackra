/**
 * Stackra file contract:
 * Purpose: unit tests of `handleTurboCacheRequest`: fail closed without the token secret, bearer auth, status and
 *          events, PUT/GET/HEAD round trip with the signature tag, team namespacing, the TTL miss, the size and length
 *          limits, hash and team validation, the artifacts query and method refusals.
 * Boundary: runs the handler in Node against the in-memory bucket stand-in; no R2, no workerd.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0026; the Turborepo remote-cache API (v8).
 */
import { handleTurboCacheRequest } from "#src/cache/handle-request";
import type { TurboCacheEnv } from "#src/interfaces";

import { memoryBucket, type MemoryBucket } from "./fixtures/memory-bucket.fixture";

const BASE = "https://cache.example.test";
const AUTH = { authorization: "Bearer s3cret" };

let bucket: MemoryBucket;
let env: TurboCacheEnv;

beforeEach(() => {
  bucket = memoryBucket();
  env = {
    BUCKET: bucket,
    TURBO_CACHE_TOKEN: "s3cret",
    TURBO_CACHE_MAX_ARTIFACT_BYTES: "16",
    TURBO_CACHE_KEY_PREFIX: "v8/",
    TURBO_CACHE_TTL_SECONDS: "60",
    TURBO_CACHE_MAX_QUERY_HASHES: "2",
  };
});

const call = (path: string, init: RequestInit = {}): Promise<Response> =>
  handleTurboCacheRequest(
    new Request(`${BASE}${path}`, { ...init, headers: { ...AUTH, ...init.headers } }),
    env,
  );

const put = (path: string, text: string, headers: Record<string, string> = {}) =>
  call(path, {
    method: "PUT",
    body: text,
    headers: { "content-length": String(new TextEncoder().encode(text).byteLength), ...headers },
  });

describe("handleTurboCacheRequest", () => {
  it("fails closed with 503 when the token secret is missing", async () => {
    env = { ...env, TURBO_CACHE_TOKEN: undefined };
    const response = await call("/v8/artifacts/status");
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "cache_misconfigured" } });
  });

  it.each([{}, { authorization: "Bearer wrong" }, { authorization: "s3cret" }])(
    "refuses %j with 401",
    async (headers) => {
      const response = await handleTurboCacheRequest(
        new Request(`${BASE}/v8/artifacts/abc?teamId=team_1`, { headers }),
        env,
      );
      expect(response.status).toBe(401);
    },
  );

  it("answers 404 outside /v8/artifacts", async () => {
    expect((await call("/v2/user")).status).toBe(404);
    expect((await call("/v8/artifactsabc")).status).toBe(404);
  });

  it("reports the cache enabled", async () => {
    const response = await call("/v8/artifacts/status");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "enabled" });
  });

  it("accepts and drops usage events", async () => {
    const response = await call("/v8/artifacts/events?teamId=team_1", {
      method: "POST",
      body: JSON.stringify([{ hash: "abc", event: "HIT", source: "REMOTE" }]),
    });
    expect(response.status).toBe(200);
    expect(bucket.keys()).toEqual([]);
  });

  it("stores an artifact under the team and returns it with its tag", async () => {
    const stored = await put("/v8/artifacts/abc123?teamId=team_1", "artifact", {
      "x-artifact-tag": "sig",
      "x-artifact-duration": "420",
    });
    expect(stored.status).toBe(202);
    expect(await stored.json()).toEqual({ urls: ["team_1/abc123"] });
    expect(bucket.keys()).toEqual(["v8/team_1/abc123"]);

    const head = await call("/v8/artifacts/abc123?teamId=team_1", { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(head.headers.get("x-artifact-tag")).toBe("sig");

    const got = await call("/v8/artifacts/abc123?teamId=team_1");
    expect(got.status).toBe(200);
    expect(got.headers.get("x-artifact-tag")).toBe("sig");
    expect(got.headers.get("content-type")).toBe("application/octet-stream");
    expect(await got.text()).toBe("artifact");
  });

  it("uses slug when teamId is absent and keeps teams apart", async () => {
    await put("/v8/artifacts/abc?slug=acme", "a");
    expect(bucket.keys()).toEqual(["v8/acme/abc"]);
    expect((await call("/v8/artifacts/abc?slug=other")).status).toBe(404);
  });

  it("misses an artifact older than the TTL", async () => {
    bucket.seed("v8/team_1/old", "x", { uploaded: new Date(Date.now() - 61_000) });
    expect((await call("/v8/artifacts/old?teamId=team_1")).status).toBe(404);
    expect((await call("/v8/artifacts/old?teamId=team_1", { method: "HEAD" })).status).toBe(404);
  });

  it("refuses an artifact over the size setting with 413", async () => {
    const response = await put("/v8/artifacts/big?teamId=team_1", "x".repeat(17));
    expect(response.status).toBe(413);
    expect(bucket.keys()).toEqual([]);
  });

  it("requires a Content-Length on upload", async () => {
    const response = await call("/v8/artifacts/abc?teamId=team_1", { method: "PUT", body: "x" });
    expect(response.status).toBe(411);
  });

  it.each(["/v8/artifacts/abc", "/v8/artifacts/abc?teamId=../x", "/v8/artifacts/abc?slug=a%2Fb"])(
    "refuses a missing or unsafe team: %s",
    async (path) => {
      expect((await call(path)).status).toBe(400);
    },
  );

  it("refuses a hash that is not letters and digits", async () => {
    expect((await call("/v8/artifacts/a.b?teamId=team_1")).status).toBe(400);
  });

  it("answers the artifacts query per hash", async () => {
    bucket.seed("v8/team_1/aaa", "four", { customMetadata: { tag: "sig", duration: "12" } });
    const response = await call("/v8/artifacts?teamId=team_1", {
      method: "POST",
      body: JSON.stringify({ hashes: ["aaa", "bbb"] }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      aaa: { size: 4, taskDurationMs: 12, tag: "sig" },
      bbb: { error: { message: "Artifact not found" } },
    });
  });

  it("refuses a query over the hash setting or with a bad body", async () => {
    const over = await call("/v8/artifacts?teamId=team_1", {
      method: "POST",
      body: JSON.stringify({ hashes: ["a", "b", "c"] }),
    });
    expect(over.status).toBe(400);
    const bad = await call("/v8/artifacts?teamId=team_1", { method: "POST", body: "nope" });
    expect(bad.status).toBe(400);
  });

  it("refuses other methods with 405", async () => {
    expect((await call("/v8/artifacts/abc?teamId=team_1", { method: "DELETE" })).status).toBe(405);
    expect((await call("/v8/artifacts/status", { method: "POST" })).status).toBe(405);
    expect((await call("/v8/artifacts?teamId=team_1")).status).toBe(405);
  });
});
