/**
 * Stackra file contract:
 * Purpose: unit tests of `WranglerEdgeKvDriver`: put and delete run `wrangler kv key put|delete --remote` in the
 *          configured namespace with the exact key and value; an unset or malformed namespace id is refused.
 * Boundary: test only; the command runner is a fake, nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (the KV copy); app-shells 16 (point 10).
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { EdgeKvConfig } from "#node/config/edge-kv.config";
import { WranglerEdgeKvDriver } from "#node/drivers/wrangler-edge-kv.driver";
import type { CommandRunner } from "#node/types/command-runner.type";

const NAMESPACE = "0123456789abcdef0123456789abcdef";

/** A driver whose runner records every call. */
function driver(): { kv: WranglerEdgeKvDriver; calls: Parameters<CommandRunner>[] } {
  const calls: Parameters<CommandRunner>[] = [];
  const kv = new WranglerEdgeKvDriver(
    buildConfig(EdgeKvConfig, { values: { namespaceId: NAMESPACE } }),
  );
  kv.run = async (command, args, options) => {
    calls.push([command, args, options]);
    return "";
  };
  return { kv, calls };
}

describe("WranglerEdgeKvDriver", () => {
  it("puts a row with wrangler in the namespace", async () => {
    const { kv, calls } = driver();
    await kv.put("release:mezzora:console", '{"version":"1.2.0"}');
    expect(calls).toEqual([
      [
        "wrangler",
        [
          "kv",
          "key",
          "put",
          "release:mezzora:console",
          '{"version":"1.2.0"}',
          `--namespace-id=${NAMESPACE}`,
          "--remote",
        ],
        {},
      ],
    ]);
  });

  it("expires a row after the given seconds", async () => {
    const { kv, calls } = driver();
    await kv.put("host:mezzora-pr-1.figentra.cloud", "{}", 604_800);
    expect(calls[0]?.[1]).toContain("--ttl=604800");
  });

  it("deletes a row with wrangler in the namespace", async () => {
    const { kv, calls } = driver();
    await kv.delete("canary:mezzora:console");
    expect(calls).toEqual([
      [
        "wrangler",
        [
          "kv",
          "key",
          "delete",
          "canary:mezzora:console",
          `--namespace-id=${NAMESPACE}`,
          "--remote",
        ],
        {},
      ],
    ]);
  });

  it("reads a row as text with wrangler in the namespace", async () => {
    const { kv, calls } = driver();
    kv.run = async (command, args, options) => {
      calls.push([command, args, options]);
      return '{"product":"mezzora"}';
    };
    await expect(kv.read("host:mezzora-pr-1.figentra.cloud")).resolves.toBe(
      '{"product":"mezzora"}',
    );
    expect(calls[0]?.[1]).toEqual([
      "kv",
      "key",
      "get",
      "host:mezzora-pr-1.figentra.cloud",
      `--namespace-id=${NAMESPACE}`,
      "--text",
      "--remote",
    ]);
  });

  it("reads a missing row as null, and throws any other failure", async () => {
    const { kv } = driver();
    kv.run = async () => {
      throw new Error("wrangler kv failed: Failed to fetch https://api/values/x - 404: Not Found");
    };
    await expect(kv.read("host:x")).resolves.toBeNull();
    kv.run = async () => {
      throw new Error("wrangler kv failed: Failed to fetch https://api/values/x - 403: Forbidden");
    };
    await expect(kv.read("host:x")).rejects.toThrow("403");
  });

  it("refuses an unset namespace", () => {
    expect(() => new WranglerEdgeKvDriver(buildConfig(EdgeKvConfig))).toThrow(TypeError);
  });

  it("refuses a malformed namespace id", () => {
    expect(() => buildConfig(EdgeKvConfig, { values: { namespaceId: "not-an-id" } })).toThrow();
  });
});
