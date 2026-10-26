/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSurfaces`: the shaping example passes; ops with more than `contributes`, `contributes`
 *          elsewhere, `content` off landing, a missing shell line, a path outside the assets root (default or
 *          declared), a shared host, an app id outside `<prefix>.<product>.<app>` and an unknown app member each fail
 *          with their path and code.
 * Boundary: test only; runways are built through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (enforcement), ADR 0436, ADR 0439 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { PRODUCT_ROOT, STAFF_APP } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { checkSurfaces } from "#core/functions/check-surfaces.function";
import { parseRunway } from "#core/functions/parse-runway.function";
import type { RootRunway } from "#core/types/root-runway.type";

/** A product root runway with these sections. */
function rootWith(sections: Record<string, unknown>): RootRunway {
  return parseRunway("root", {
    version: 3,
    project: "mezzora",
    product: { key: "mezzora" },
    environments: {},
    ...sections,
  });
}

/** The codes and paths of `root`'s issues. */
function codes(root: RootRunway, members: readonly string[] = []): string[] {
  return checkSurfaces(root, members).map((issue) => `${issue.code} ${issue.path}`);
}

describe("checkSurfaces", () => {
  it("passes the shaping example", () => {
    expect(checkSurfaces(PRODUCT_ROOT, [])).toEqual([]);
  });

  it("keeps ops to contributes, contributes to ops and content to landing", () => {
    const root = rootWith({
      surfaces: {
        ops: { contributes: "@mezzora/ops-ui", host: "ops.mezzora" },
        console: { shell: "os/console@3", contributes: "@mezzora/ops-ui", content: "assets/x" },
      },
    });

    expect(codes(root)).toEqual([
      "ops_contributes_only surfaces.ops",
      "contributes_outside_ops surfaces.console.contributes",
      "content_outside_landing surfaces.console.content",
    ]);
  });

  it("needs a shell line and refuses a shared host", () => {
    const root = rootWith({
      surfaces: {
        console: { shell: "os/console@3", host: "mezzora" },
        landing: { host: "mezzora" },
      },
    });

    expect(codes(root)).toEqual([
      "shell_missing surfaces.landing.shell",
      "host_duplicate surfaces.landing.host",
    ]);
  });

  it("refuses paths outside the assets root, the default or a declared one", () => {
    const outside = rootWith({
      surfaces: { landing: { shell: "os/landing@1", content: "seeds" } },
    });
    expect(codes(outside)).toEqual(["path_outside_assets surfaces.landing.content"]);

    const declared = rootWith({ assets: { root: "brand" }, mobile: { staff: STAFF_APP } });
    expect(codes(declared)).toEqual([
      "path_outside_assets mobile.staff.assets",
      "path_outside_assets mobile.staff.store",
    ]);
  });

  it("refuses an app id outside <prefix>.<product>.<app>", () => {
    const identity = { ...STAFF_APP.identity, ios: { bundleId: "com.example.other", team: "x" } };
    const root = rootWith({ mobile: { staff: { ...STAFF_APP, identity } } });

    expect(codes(root)).toEqual(["app_id_pattern mobile.staff.identity.ios.bundleId"]);
  });

  it("keeps the own domain and canonical choice to a landing site beside its platform host", () => {
    const root = rootWith({
      surfaces: {
        console: { shell: "os/console@3", host: "console.mezzora", canonical: "own" },
        landing: { shell: "os/landing@1", ownDomain: { production: "mezzora.example" } },
        ops: { contributes: "@mezzora/ops-ui", ownDomain: { production: "ops.example" } },
      },
    });
    expect(codes(root)).toEqual([
      "own_domain_outside_landing surfaces.console.ownDomain",
      "own_domain_without_host surfaces.landing.host",
      "ops_contributes_only surfaces.ops",
    ]);

    const orphan = rootWith({
      surfaces: { landing: { shell: "os/landing@1", host: "mezzora", canonical: "own" } },
    });
    expect(codes(orphan)).toEqual(["canonical_without_own_domain surfaces.landing.canonical"]);
  });

  it("refuses an app reference to a member that does not exist", () => {
    const root = rootWith({
      surfaces: {
        till: { shell: "commerce/till@1", app: { member: "till", adr: "0442" } },
      },
    });

    expect(codes(root, ["till"])).toEqual([]);
    expect(codes(root, [])).toEqual(["app_member_unknown surfaces.till.app.member"]);
  });
});
