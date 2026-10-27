/**
 * Stackra file contract:
 * Purpose: unit tests of `publishShell`: the shell row keeps the current release and carries the next one as its
 *          canary with the scopes and start; a bad surface or line and an empty scope list are refused before any
 *          write.
 * Boundary: test only; the KV writer is in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); app-shells 16 (point 3); owner decision D6.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { publishShell } from "#node/functions/publish-shell.function";
import { MemoryEdgeKv } from "#node/functions/__tests__/fixtures/memory-edge-kv.fixture";

const CURRENT = {
  version: "3.4.0",
  entry: "https://assets.test/shells/console/3.4.0/entry.js",
  importMap: { imports: { react: "https://assets.test/shared/react.js" } },
};
const NEXT = { ...CURRENT, version: "3.5.0" };
const NOW = new Date("2026-10-28T00:00:00.000Z");

describe("publishShell", () => {
  it("writes the current release with the next one on its canary", async () => {
    const kv = new MemoryEdgeKv();
    const canary = await publishShell({
      kv,
      surface: "console",
      line: "3",
      current: CURRENT,
      next: NEXT,
      canaryScopes: ["scp_internal", "scp_demo"],
      now: NOW,
    });
    expect(canary).toEqual({
      ...NEXT,
      scopes: ["scp_internal", "scp_demo"],
      since: NOW.toISOString(),
    });
    expect(kv.json("shell:console:3")).toEqual({ ...CURRENT, canary });
    expect(kv.calls).toHaveLength(1);
  });

  it("refuses a bad surface, line or empty scopes before writing", async () => {
    const kv = new MemoryEdgeKv();
    await expect(
      publishShell({
        kv,
        surface: "Console",
        line: "v3",
        current: CURRENT,
        next: NEXT,
        canaryScopes: [],
      }),
    ).rejects.toThrow(RunwayInvalidError);
    expect(kv.calls).toEqual([]);
  });
});
