/**
 * Stackra file contract:
 * Purpose: unit tests of `readSettings`: a full environment reads into numbers; a missing or empty token, or a
 *          missing, zero, negative or non-integer number setting, gives `undefined` (fail closed).
 * Boundary: pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0026.
 */
import { readSettings } from "#src/cache/read-settings";
import type { TurboCacheEnv } from "#src/interfaces";

import { memoryBucket } from "./fixtures/memory-bucket.fixture";

const env: TurboCacheEnv = {
  BUCKET: memoryBucket(),
  TURBO_CACHE_TOKEN: "t",
  TURBO_CACHE_MAX_ARTIFACT_BYTES: "1024",
  TURBO_CACHE_KEY_PREFIX: "v8/",
  TURBO_CACHE_TTL_SECONDS: "604800",
  TURBO_CACHE_MAX_QUERY_HASHES: "100",
};

describe("readSettings", () => {
  it("reads every setting", () => {
    expect(readSettings(env)).toEqual({
      token: "t",
      maxArtifactBytes: 1024,
      keyPrefix: "v8/",
      ttlSeconds: 604_800,
      maxQueryHashes: 100,
    });
  });

  it("accepts an empty key prefix", () => {
    expect(readSettings({ ...env, TURBO_CACHE_KEY_PREFIX: "" })?.keyPrefix).toBe("");
  });

  it.each([
    ["TURBO_CACHE_TOKEN", undefined],
    ["TURBO_CACHE_TOKEN", ""],
    ["TURBO_CACHE_KEY_PREFIX", undefined],
    ["TURBO_CACHE_MAX_ARTIFACT_BYTES", undefined],
    ["TURBO_CACHE_MAX_ARTIFACT_BYTES", "0"],
    ["TURBO_CACHE_MAX_ARTIFACT_BYTES", "-5"],
    ["TURBO_CACHE_TTL_SECONDS", "7d"],
    ["TURBO_CACHE_TTL_SECONDS", "1.5"],
    ["TURBO_CACHE_MAX_QUERY_HASHES", "99999999999999999999"],
  ])("fails closed when %s is %j", (name, value) => {
    expect(readSettings({ ...env, [name]: value } as TurboCacheEnv)).toBeUndefined();
  });
});
