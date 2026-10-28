/**
 * Stackra file contract:
 * Purpose: unit tests of `addPackageQuery`: it adds the package to a manifest without queries, keeps existing
 *          queries, and adds a package once.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 2); ADR 0458 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { addPackageQuery } from "#plugin/functions/add-package-query.function";
import type { ManifestWithQueries } from "#plugin/types/manifest-with-queries.type";

describe("addPackageQuery", () => {
  it("adds the package once and keeps other queries", () => {
    const manifest: ManifestWithQueries = {
      manifest: { queries: [{ package: [{ $: { "android:name": "com.other.app" } }] }] },
    };
    addPackageQuery(manifest, "woyou.aidlservice.jiuiv5");
    addPackageQuery(manifest, "woyou.aidlservice.jiuiv5");
    expect(manifest.manifest.queries).toEqual([
      { package: [{ $: { "android:name": "com.other.app" } }] },
      { package: [{ $: { "android:name": "woyou.aidlservice.jiuiv5" } }] },
    ]);
  });

  it("creates the queries of a manifest without any", () => {
    const manifest: ManifestWithQueries = { manifest: {} };
    expect(addPackageQuery(manifest, "woyou.aidlservice.jiuiv5").manifest.queries).toHaveLength(1);
  });
});
