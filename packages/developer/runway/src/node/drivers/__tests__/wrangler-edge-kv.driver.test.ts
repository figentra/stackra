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

  it("refuses an unset namespace", () => {
    expect(() => new WranglerEdgeKvDriver(buildConfig(EdgeKvConfig))).toThrow(TypeError);
  });

  it("refuses a malformed namespace id", () => {
    expect(() => buildConfig(EdgeKvConfig, { values: { namespaceId: "not-an-id" } })).toThrow();
  });
});
