/**
 * Stackra file contract:
 * Purpose: unit tests of `parseRunway` for the app-shell sections of the root runway: `surfaces`, `mobile` and
 *          `assets` as the shaping example writes them pass; an unknown surface, a bad shell line, a path with `..`, a
 *          duplicated package, a mobile app without its EAS block and an unknown field fail with their paths; and the
 *          lanes repository index needs `worktrees` and a distinct index per repository.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 3), ADR 0439 (decision 2), STA-863.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { PRODUCT_ROOT, STAFF_APP } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { parseRunway } from "#core/functions/parse-runway.function";

const ROOT = { version: 3, project: "mezzora", environments: {} };

/** The paths of the issues `run` throws. */
function issuePaths(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("expected a RunwayInvalidError");
}

/** Parses a root runway with these surfaces. */
function withSurfaces(surfaces: unknown): () => unknown {
  return () => parseRunway("root", { ...ROOT, surfaces });
}

/** Parses a root runway with this staff app. */
function withStaffApp(app: unknown): () => unknown {
  return () => parseRunway("root", { ...ROOT, mobile: { staff: app } });
}

/** Parses a root runway with these dev lanes. */
function withLanes(lanes: unknown): () => unknown {
  return () => parseRunway("root", { ...ROOT, environments: { dev: { lanes } } });
}

describe("parseRunway surfaces, mobile and assets", () => {
  it("accepts the shaping example", () => {
    expect(PRODUCT_ROOT.surfaces?.console?.shell).toBe("os/console@3");
    expect(PRODUCT_ROOT.surfaces?.ops).toEqual({ contributes: "@mezzora/ops-ui" });
    expect(PRODUCT_ROOT.mobile?.["staff"]).toEqual(STAFF_APP);
    expect(parseRunway("root", { ...ROOT, assets: { root: "brand-assets" } }).assets).toEqual({
      root: "brand-assets",
    });
  });

  it("refuses an unknown surface, a bad shell line, a .. path and a repeated package", () => {
    expect(issuePaths(withSurfaces({ portal: { shell: "os/console@3" } }))).toEqual([
      "surfaces.portal",
    ]);
    expect(issuePaths(withSurfaces({ console: { shell: "console@3" } }))).toEqual([
      "surfaces.console.shell",
    ]);
    expect(issuePaths(withSurfaces({ landing: { content: "assets/../secrets" } }))).toEqual([
      "surfaces.landing.content",
    ]);
    expect(issuePaths(withSurfaces({ console: { packages: ["@a/ui", "@a/ui"] } }))).toEqual([
      "surfaces.console.packages",
    ]);
    expect(issuePaths(withSurfaces({ console: { theme: "dark" } }))).toEqual(["surfaces.console"]);
  });

  it("refuses a mobile app without its EAS block, a bad app id and a bad capability", () => {
    const { eas: _eas, ...withoutEas } = STAFF_APP;

    expect(issuePaths(withStaffApp(withoutEas))).toEqual(["mobile.staff.eas"]);
    expect(
      issuePaths(
        withStaffApp({
          ...STAFF_APP,
          identity: { ...STAFF_APP.identity, android: { package: "a-b" } },
        }),
      ),
    ).toEqual(["mobile.staff.identity.android.package"]);
    expect(issuePaths(withStaffApp({ ...STAFF_APP, capabilities: ["Device:Sunmi"] }))).toEqual([
      "mobile.staff.capabilities.0",
    ]);
  });

  it("needs worktrees with a repository index, and a distinct index per repository", () => {
    const base = { enabled: true, portStep: 100, from: "STACKRA_LANE" };

    expect(
      withLanes({ ...base, repoIndex: { os: 0, commerce: 1 }, worktrees: 10 })(),
    ).toBeDefined();
    expect(issuePaths(withLanes({ ...base, repoIndex: { os: 0 } }))).toEqual([
      "environments.dev.lanes.worktrees",
    ]);
    expect(
      issuePaths(withLanes({ ...base, repoIndex: { os: 0, commerce: 0 }, worktrees: 10 })),
    ).toEqual(["environments.dev.lanes.repoIndex"]);
  });
});
