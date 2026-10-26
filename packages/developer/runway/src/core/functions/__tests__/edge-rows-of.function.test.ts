/**
 * Stackra file contract:
 * Purpose: unit tests of `edgeRowsOf`: a `host:` row per surface host under the environment's zone, with the home
 *          region, and one `apple-app-site-association` and one `assetlinks.json` row per linked host; a host without
 *          a zone and a linked app without its team id or fingerprint are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 6), ADR 0436 (decision 11), ADR 0439.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { PRODUCT_ROOT, SIGNING } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { edgeRowsOf } from "#core/functions/edge-rows-of.function";

describe("edgeRowsOf", () => {
  it("writes a host row per surface host and the app-link files of each linked host", () => {
    const rows = edgeRowsOf(PRODUCT_ROOT, "production", SIGNING);

    expect(rows.map((row) => row.key)).toEqual([
      "host:console.mezzora.example.com",
      "host:mezzora.example.com",
      "host:till.mezzora.example.com",
      "wellknown:console.mezzora.example.com:apple-app-site-association",
      "wellknown:console.mezzora.example.com:assetlinks.json",
    ]);
    expect(JSON.parse(rows[0]?.value ?? "")).toEqual({
      product: "mezzora",
      surface: "console",
      region: "ksa",
      status: "active",
      realm: "tenant",
      canonical: "console.mezzora.example.com",
    });
    expect(JSON.parse(rows[3]?.value ?? "")).toEqual({
      applinks: {
        details: [{ appIDs: ["TEAM123456.com.example.mezzora.staff"], components: [{ "/": "*" }] }],
      },
      webcredentials: { apps: ["TEAM123456.com.example.mezzora.staff"] },
    });
    expect(JSON.parse(rows[4]?.value ?? "")).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.example.mezzora.staff",
          sha256_cert_fingerprints: ["AA:BB"],
        },
      },
    ]);
  });

  it("refuses a host without a zone and a linked app without its signing facts", () => {
    expect(() => edgeRowsOf(PRODUCT_ROOT, "staging", SIGNING)).toThrow(RunwayUnresolvedError);
    expect(() => edgeRowsOf(PRODUCT_ROOT, "production", { ...SIGNING, appleTeamIds: {} })).toThrow(
      /no Apple team id/,
    );
    expect(() =>
      edgeRowsOf(PRODUCT_ROOT, "production", { ...SIGNING, androidFingerprints: {} }),
    ).toThrow(/no signing fingerprint/);
  });
});
