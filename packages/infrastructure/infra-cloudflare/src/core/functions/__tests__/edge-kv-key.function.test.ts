/**
 * Stackra file contract:
 * Purpose: unit tests of `edgeKvKey`: each key family joins its parts with `:` in ADR 0437's order, and an empty part
 *          or one holding `:` is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { edgeKvKey } from "#core/functions/edge-kv-key.function";

describe("edgeKvKey", () => {
  it("builds each key family", () => {
    expect(edgeKvKey("host", "shop.acme.example")).toBe("host:shop.acme.example");
    expect(edgeKvKey("boot", "mezzora", "console", "scp_01J")).toBe("boot:mezzora:console:scp_01J");
    expect(edgeKvKey("shell", "console", "3")).toBe("shell:console:3");
    expect(edgeKvKey("release", "mezzora", "console")).toBe("release:mezzora:console");
    expect(edgeKvKey("canary", "mezzora", "console")).toBe("canary:mezzora:console");
    expect(edgeKvKey("wellknown", "shop.acme.example", "assetlinks.json")).toBe(
      "wellknown:shop.acme.example:assetlinks.json",
    );
  });

  it("refuses an empty part or one holding a colon", () => {
    expect(
      thrownIssues(() => edgeKvKey("release", "mezzora", "")).map((issue) => issue.path),
    ).toEqual(["release.1"]);
    expect(thrownIssues(() => edgeKvKey("host", "a:b")).map((issue) => issue.path)).toEqual([
      "host.0",
    ]);
  });
});
