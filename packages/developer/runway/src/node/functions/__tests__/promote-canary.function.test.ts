/**
 * Stackra file contract:
 * Purpose: unit tests of `promoteCanary`: a promoted release canary writes the release row (without scopes and
 *          start) before it removes the canary row; a rolled-back one removes the canary row only; a held one writes
 *          nothing; a promoted shell canary writes the canary release alone and a rolled-back one the current release
 *          alone; setting overrides apply.
 * Boundary: test only; the KV writer is in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); owner decision D6; app-shells 16 (points 3 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { promoteCanary } from "#node/functions/promote-canary.function";
import { MemoryEdgeKv } from "#node/functions/__tests__/fixtures/memory-edge-kv.fixture";
import type { EdgeShellRelease } from "#node/types/edge-shell-release.type";

const SINCE = "2026-10-28T00:00:00.000Z";
const LATER = new Date("2026-10-29T01:00:00.000Z");
const RELEASE = {
  version: "1.3.0",
  url: "https://assets.test/mezzora/console/1.3.0/entry.js",
  base: "https://assets.test/mezzora/console/1.3.0/",
  targets: "console@3",
  modulepreload: ["https://assets.test/mezzora/console/1.3.0/entry.js"],
  css: [],
};
const CANARY = { ...RELEASE, scopes: ["scp_internal"], since: SINCE };
const HEALTHY = { requests: 5000, errors: 1 };
const FAILING = { requests: 5000, errors: 500 };
const SHELL_CURRENT: EdgeShellRelease = {
  version: "3.4.0",
  entry: "https://assets.test/shells/console/3.4.0/entry.js",
  importMap: { imports: { react: "https://assets.test/shared/react.js" } },
};
const SHELL_NEXT: EdgeShellRelease = { ...SHELL_CURRENT, version: "3.5.0" };

describe("promoteCanary", () => {
  it("promotes a healthy release canary: release first, then the canary row goes", async () => {
    const kv = new MemoryEdgeKv();
    const verdict = await promoteCanary({
      kv,
      promotion: { kind: "release", product: "mezzora", surface: "console", canary: CANARY },
      sample: HEALTHY,
      now: LATER,
    });
    expect(verdict).toBe("promote");
    expect(kv.calls).toEqual([
      ["put", "release:mezzora:console", JSON.stringify(RELEASE)],
      ["delete", "canary:mezzora:console"],
    ]);
  });

  it("rolls back a failing release canary by removing the canary row only", async () => {
    const kv = new MemoryEdgeKv();
    const verdict = await promoteCanary({
      kv,
      promotion: { kind: "release", product: "mezzora", surface: "console", canary: CANARY },
      sample: FAILING,
      now: LATER,
    });
    expect(verdict).toBe("rollback");
    expect(kv.calls).toEqual([["delete", "canary:mezzora:console"]]);
  });

  it("holds without writing", async () => {
    const kv = new MemoryEdgeKv();
    const verdict = await promoteCanary({
      kv,
      promotion: { kind: "release", product: "mezzora", surface: "console", canary: CANARY },
      sample: { requests: 10, errors: 0 },
      now: LATER,
    });
    expect(verdict).toBe("hold");
    expect(kv.calls).toEqual([]);
  });

  it("promotes a shell canary to the line's only release", async () => {
    const kv = new MemoryEdgeKv();
    const canary = { ...SHELL_NEXT, scopes: ["scp_internal"], since: SINCE };
    await promoteCanary({
      kv,
      promotion: { kind: "shell", surface: "console", line: "3", current: SHELL_CURRENT, canary },
      sample: HEALTHY,
      now: LATER,
    });
    expect(kv.calls).toEqual([["put", "shell:console:3", JSON.stringify(SHELL_NEXT)]]);
  });

  it("rolls a failing shell canary back to the current release alone", async () => {
    const kv = new MemoryEdgeKv();
    const canary = { ...SHELL_NEXT, scopes: ["scp_internal"], since: SINCE };
    await promoteCanary({
      kv,
      promotion: { kind: "shell", surface: "console", line: "3", current: SHELL_CURRENT, canary },
      sample: FAILING,
      now: LATER,
    });
    expect(kv.calls).toEqual([["put", "shell:console:3", JSON.stringify(SHELL_CURRENT)]]);
  });

  it("applies setting overrides", async () => {
    const kv = new MemoryEdgeKv();
    const verdict = await promoteCanary({
      kv,
      promotion: { kind: "release", product: "mezzora", surface: "console", canary: CANARY },
      sample: HEALTHY,
      now: LATER,
      settings: { windowHours: 48 },
    });
    expect(verdict).toBe("hold");
  });
});
