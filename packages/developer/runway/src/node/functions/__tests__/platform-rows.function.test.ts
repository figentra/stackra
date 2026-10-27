/**
 * Stackra file contract:
 * Purpose: unit tests of `platformRows`: a host row per host of every web surface (not ops) under the environment's
 *          zone, an own domain ending in `.` kept as given, every host of a surface naming its canonical one, the
 *          first region as home unless one is given; app-link files on each linked host with the Apple app id from
 *          the team map and the Android certificates; a missing zone, region, team id or certificate is listed.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); app-shells 5.3 and 8.3; owner decisions D2 and D9.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunway } from "#core/functions/parse-runway.function";
import { platformRows } from "#node/functions/platform-rows.function";
import { PRODUCT_ROOT } from "#node/functions/__tests__/fixtures/product-root.fixture";

const APP_LINKS = {
  appleTeams: { figentra: "ABCDE12345" },
  androidCertificates: { staff: ["AA:BB"] },
};

/** The host row of a production host of `surface`. */
const row = (surface: string, canonical: string) => ({
  product: "mezzora",
  surface,
  region: "me-central",
  status: "active",
  realm: "tenant",
  canonical,
});

/** The paths of the RunwayInvalidError `call` throws. */
function issuePaths(call: () => unknown): string[] {
  try {
    call();
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("expected a RunwayInvalidError");
}

describe("platformRows", () => {
  it("writes host rows and app-link files", () => {
    const rows = platformRows(parseRunway("root", PRODUCT_ROOT), "production", {
      appLinks: APP_LINKS,
    });
    const parsed = Object.fromEntries(
      Object.entries(rows).map(([key, value]) => [key, JSON.parse(value)]),
    );
    expect(parsed).toEqual({
      "host:console.mezzora.figentra.com": row("console", "console.mezzora.figentra.com"),
      "host:mezzora.figentra.com": row("landing", "mezzora.figentra.com"),
      "host:mezzora.com": row("landing", "mezzora.figentra.com"),
      "wellknown:console.mezzora.figentra.com:apple-app-site-association": {
        applinks: {
          details: [
            { appIDs: ["ABCDE12345.com.figentra.mezzora.staff"], components: [{ "/": "*" }] },
          ],
        },
      },
      "wellknown:console.mezzora.figentra.com:assetlinks.json": [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: "com.figentra.mezzora.staff",
            sha256_cert_fingerprints: ["AA:BB"],
          },
        },
      ],
    });
  });

  it("takes the region it is given", () => {
    const rows = platformRows(parseRunway("root", PRODUCT_ROOT), "production", {
      region: "eu-west",
      appLinks: APP_LINKS,
    });
    expect(JSON.parse(rows["host:mezzora.com"] as string).region).toBe("eu-west");
  });

  it("lists every row it cannot resolve", () => {
    const root = parseRunway("root", {
      ...PRODUCT_ROOT,
      environments: { production: {} },
    });
    expect(issuePaths(() => platformRows(root, "production", {}))).toEqual([
      "environments.production.regions",
      "surfaces.console.host",
      "surfaces.landing.hosts.0.host",
      "mobile.staff.identity.links.0",
      "mobile.staff.identity.ios.team",
      "mobile.staff.identity.android.package",
    ]);
  });
});
