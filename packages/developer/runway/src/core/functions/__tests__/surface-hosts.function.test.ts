/**
 * Stackra file contract:
 * Purpose: unit tests of `surfaceHosts`: relative and absolute names resolve, duplicates collapse, `ops` is skipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-267.
 */
import { describe, expect, it } from "@stackra/testing";

import { surfaceHosts } from "#core/functions/surface-hosts.function";
import type { RootRunway } from "#core/types/root-runway.type";

const ROOT = {
  environments: { production: { domains: { zone: "figentra.com" } } },
  surfaces: {
    web: { host: "app.mezzora", hosts: [{ host: "mezzora.com." }, { host: "app.mezzora" }] },
    ops: { kind: "ops" },
  },
} as unknown as RootRunway;

describe("surfaceHosts", () => {
  it("resolves each host once and skips ops", () => {
    expect(surfaceHosts(ROOT, "production")).toEqual(["app.mezzora.figentra.com", "mezzora.com"]);
  });
  it("keeps only absolute names in an environment with no zone", () => {
    expect(surfaceHosts(ROOT, "dev")).toEqual(["mezzora.com"]);
  });
});
