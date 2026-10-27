/**
 * Stackra file contract:
 * Purpose: unit tests of `parseRunway` for the root `surfaces` and `mobile` blocks: the product repositories' drafts
 *          (Mezzora, Academorix) parse; the `ops` surface holds only a declarative contribution (a shell, a component
 *          or a module path as a block fails); asset paths outside `assets/` fail; two canonical hosts, a repeated
 *          capability and a repository index used twice fail; an app runway takes per-tenant white-label variants.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 3, enforcement); ADR 0439; app-shells section 16
 *                     point 7; STA-863.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunway } from "#core/functions/parse-runway.function";

const ROOT = { version: 3, project: "mezzora", environments: {} };

/** Mezzora's draft blocks, as its root runway carries them. */
const SURFACES = {
  console: {
    shell: "os/console@3",
    host: "console.mezzora",
    packages: ["@figentra/mezzora-console-ui", "@figentra/mezzora-kds-ui"],
  },
  till: { shell: "commerce/till@1", host: "till.mezzora", packages: ["@figentra/mezzora-till-ui"] },
  landing: { shell: "os/landing@1", host: "mezzora", content: "assets/landing" },
  ops: { contributes: "@figentra/mezzora-ops-ui" },
};

const STAFF = {
  template: "os/mobile@3",
  packages: ["@figentra/mezzora-mobile-ui"],
  assets: "assets/mobile/staff",
  store: "assets/store/staff",
  identity: {
    name: { en: "Mezzora Staff", ar: "ميزورا للموظفين" },
    ios: { bundleId: "com.figentra.mezzora.staff", team: "figentra" },
    android: { package: "com.figentra.mezzora.staff" },
    scheme: "mezzora-staff",
    links: ["console.mezzora.figentra.com"],
  },
  capabilities: ["scanner", "push", "printer"],
  stores: { apple: { account: "figentra" }, google: { account: "figentra" } },
  eas: { project: "ref:expo.projectId", channel: "production" },
};

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

const withSurfaces = (surfaces: unknown) => () => parseRunway("root", { ...ROOT, surfaces });
const withMobile = (mobile: unknown) => () => parseRunway("root", { ...ROOT, mobile });
const appWithWhiteLabel = (whiteLabel: unknown) =>
  parseRunway("app", { version: 3, environments: {}, release: { mobile: { whiteLabel } } });

describe("parseRunway surfaces and mobile", () => {
  it("accepts Mezzora's draft blocks and Academorix's hosts, tablet and white-label", () => {
    const parsed = parseRunway("root", { ...ROOT, surfaces: SURFACES, mobile: { staff: STAFF } });
    expect(parsed.surfaces).toEqual(SURFACES);
    expect(parsed.mobile).toEqual({ staff: STAFF });

    const academorix = parseRunway("root", {
      ...ROOT,
      project: "academorix",
      product: { key: "academorix" },
      surfaces: {
        landing: {
          shell: "os/landing@1",
          content: "assets/landing",
          packages: ["@figentra/academorix-landing-blocks"],
          host: "academorix",
          hosts: [{ host: "academorix.com", canonical: true }],
        },
        portal: {
          shell: "os/portal@3",
          packages: ["@figentra/academorix-family-ui"],
          host: "*.academorix.com",
        },
      },
      mobile: {
        academorix: {
          ...STAFF,
          assets: "assets/mobile/academorix",
          tablet: true,
          whiteLabel: {
            entitlement: "entitlement:academorix:white-label",
            modes: ["managed", "bring-your-own"],
          },
        },
      },
    });
    expect(academorix.mobile?.["academorix"]?.whiteLabel?.modes).toEqual([
      "managed",
      "bring-your-own",
    ]);
  });

  it("accepts a declarative ops contribution over registered blocks", () => {
    const ops = {
      contributes: {
        package: "@figentra/juristra-ops-ui",
        panels: [{ key: "matters", block: "os/table", props: { resource: "matters" } }],
        widgets: [{ key: "open_matters", block: "os/stat", title: "Open matters" }],
      },
    };

    expect(parseRunway("root", { ...ROOT, surfaces: { ops } }).surfaces?.ops).toEqual(ops);
  });

  it("refuses a non-declarative ops contribution", () => {
    expect(
      issuePaths(withSurfaces({ ops: { shell: "os/ops@1", contributes: "@figentra/x-ops" } })),
    ).toEqual(["surfaces.ops"]);
    const entry = (panel: unknown) =>
      withSurfaces({ ops: { contributes: { package: "@figentra/x-ops", panels: [panel] } } });
    expect(issuePaths(entry({ key: "a", block: "os/table", component: "./Panel.tsx" }))).toEqual([
      "surfaces.ops.contributes",
    ]);
    expect(issuePaths(entry({ key: "a", block: "./Panel.tsx" }))).toEqual([
      "surfaces.ops.contributes",
    ]);
    expect(issuePaths(entry({ key: "a", block: "@figentra/x-ops#Panel" }))).toEqual([
      "surfaces.ops.contributes",
    ]);
  });

  it("refuses contributes on another surface, a missing shell and an unknown key", () => {
    expect(
      issuePaths(withSurfaces({ console: { shell: "os/console@3", contributes: "@figentra/x" } })),
    ).toEqual(["surfaces.console"]);
    expect(issuePaths(withSurfaces({ console: { host: "console.x" } }))).toEqual([
      "surfaces.console.shell",
    ]);
    expect(issuePaths(withSurfaces({ console: { shell: "console" } }))).toEqual([
      "surfaces.console.shell",
    ]);
  });

  it("refuses asset paths outside assets/", () => {
    expect(
      issuePaths(withSurfaces({ landing: { shell: "os/landing@1", content: "brand/landing" } })),
    ).toEqual(["surfaces.landing.content"]);
    expect(issuePaths(withMobile({ staff: { ...STAFF, assets: "assets/../secrets" } }))).toEqual([
      "mobile.staff.assets",
    ]);
    expect(issuePaths(withMobile({ staff: { ...STAFF, store: "/tmp/store" } }))).toEqual([
      "mobile.staff.store",
    ]);
  });

  it("refuses two canonical hosts, a repeated capability and an unknown app key", () => {
    const hosts = [
      { host: "a.com", canonical: true },
      { host: "b.com", canonical: true },
    ];
    expect(issuePaths(withSurfaces({ landing: { shell: "os/landing@1", hosts } }))).toEqual([
      "surfaces.landing.hosts",
    ]);
    expect(issuePaths(withMobile({ staff: { ...STAFF, capabilities: ["push", "push"] } }))).toEqual(
      ["mobile.staff.capabilities"],
    );
    expect(issuePaths(withMobile({ staff: { ...STAFF, flavour: "x" } }))).toEqual(["mobile.staff"]);
  });

  it("refuses a repository index used twice in the lanes table", () => {
    const lanes = { portStep: 100, repos: { os: 0, commerce: 0 } };

    expect(
      issuePaths(() => parseRunway("root", { ...ROOT, environments: { dev: { lanes } } })),
    ).toEqual(["environments.dev.lanes.repos"]);
  });

  it("takes per-tenant white-label variants in an app runway, and the old boolean", () => {
    const whiteLabel = { entitlement: "entitlement:commerce:white-label", modes: ["managed"] };
    expect(appWithWhiteLabel(whiteLabel).release?.mobile?.whiteLabel).toEqual(whiteLabel);
    expect(appWithWhiteLabel(true).release?.mobile?.whiteLabel).toBe(true);
  });
});
