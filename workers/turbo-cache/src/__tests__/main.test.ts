/**
 * Stackra file contract:
 * Purpose: unit tests of the Worker entry: every answer, a refusal and a served status alike, names the version that
 *          gave it in `x-stackra-version` (the CF_VERSION_METADATA binding's id), the deploy smoke's proof (STA-2786).
 * Boundary: test only; the entry over the in-memory bucket, no R2, no workerd.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0026; ADR 0536.
 */
import { memoryBucket } from "#src/cache/__tests__/fixtures/memory-bucket.fixture";
import type { TurboCacheEnv } from "#src/interfaces";
import worker from "#src/main";

const VERSION = "dc8dcd28-271b-4367-9840-6c244f84cb40";

/** The Worker's environment with the version binding. */
const env: TurboCacheEnv = {
  BUCKET: memoryBucket(),
  TURBO_CACHE_TOKEN: "s3cret",
  TURBO_CACHE_MAX_ARTIFACT_BYTES: "16",
  TURBO_CACHE_KEY_PREFIX: "v8/",
  TURBO_CACHE_TTL_SECONDS: "60",
  TURBO_CACHE_MAX_QUERY_HASHES: "2",
  CF_VERSION_METADATA: { id: VERSION },
};

describe("the Worker entry", () => {
  it("names its version on the status answer the smoke reads", async () => {
    const response = await worker.fetch(
      new Request("https://cache.example.test/v8/artifacts/status", {
        headers: { authorization: "Bearer s3cret" },
      }),
      env,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-stackra-version")).toBe(VERSION);
  });

  it("names its version on a refusal too", async () => {
    const response = await worker.fetch(
      new Request("https://cache.example.test/v8/artifacts/status"),
      env,
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("x-stackra-version")).toBe(VERSION);
  });
});
