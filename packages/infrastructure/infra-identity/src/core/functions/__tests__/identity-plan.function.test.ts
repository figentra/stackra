/**
 * Stackra file contract:
 * Purpose: unit tests of `identityPlan`: the non-production instance gets the callbacks of dev, preview and staging
 *          (a BFF's `http://` dev callback in dev mode), the production instance only production's, an app with no
 *          callback there is left off unless it uses the device code, and every refusal (no `providers.zitadel`, an
 *          invalid block, an unknown instance, a callback the instance cannot hold) names its path.
 * Boundary: test only; the root runway is checked by `@stackra/runway`'s `parseRunway`, as `readRunway` would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0206 (decision 8); ADR 0277 (decisions 1 and 2); ADR 0290
 *                     (decision 8).
 */
import { parseRunway } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { IdentityInfraInvalidError } from "#core/errors/identity-infra-invalid.error";
import { identityPlan } from "#core/functions/identity-plan.function";
import { parseIdentitySeed } from "#core/functions/parse-identity-seed.function";
import type { IdentitySeed } from "#core/types/identity-seed.type";

const CALLBACK = "/api/auth/callback";

/** The root runway with the two hosted instances. */
function rootWith(zitadel?: unknown): RootRunway {
  return parseRunway("root", {
    version: 3,
    project: "acme-platform",
    environments: {},
    ...(zitadel === undefined ? {} : { providers: { zitadel } }),
  });
}

const ROOT = rootWith({
  instances: {
    nonprod: { domain: "id.staging.acme.example", environments: ["dev", "preview", "staging"] },
    prod: { domain: "id.acme.example", environments: ["production"] },
  },
});

const SEED = parseIdentitySeed({
  version: 1,
  org: { name: "Acme staff" },
  project: {
    name: "acme-platform",
    roles: [{ key: "platform_admin", name: "Platform administrator" }],
  },
  apps: {
    console: {
      kind: "bff",
      redirectUris: {
        dev: [`http://localhost:5173${CALLBACK}`],
        staging: [`https://console.staging.acme.example${CALLBACK}`],
        production: [`https://console.acme.example${CALLBACK}`],
      },
      postLogoutRedirectUris: { production: ["https://console.acme.example/"] },
    },
    mobile: {
      kind: "native",
      redirectUris: {
        dev: ["acme://auth/callback"],
        preview: ["acme://auth/callback"],
        staging: ["acme://auth/callback"],
        production: ["acme://auth/callback"],
      },
      tokenExchange: true,
    },
    cli: {
      kind: "native",
      redirectUris: { production: ["http://127.0.0.1/callback"] },
      deviceCode: true,
    },
    web: { kind: "bff", redirectUris: { production: [`https://www.acme.example${CALLBACK}`] } },
  },
  machines: { identity: { name: "Identity service", instanceRoles: ["org_manager"] } },
});

/** The paths a failing plan reports. */
function pathsOf(root: RootRunway, seed: IdentitySeed, instance: string): string[] {
  try {
    identityPlan(root, seed, instance);
  } catch (error) {
    if (error instanceof IdentityInfraInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  return [];
}

/** The seed with one app replaced. */
function seedWith(key: string, app: Record<string, unknown>): IdentitySeed {
  return parseIdentitySeed({ ...SEED, apps: { [key]: app } });
}

describe("identityPlan", () => {
  it("plans the non-production instance from dev, preview and staging", () => {
    const plan = identityPlan(ROOT, SEED, "nonprod");

    expect(plan).toMatchObject({
      instance: "nonprod",
      domain: "id.staging.acme.example",
      issuer: "https://id.staging.acme.example",
      environments: ["dev", "preview", "staging"],
      org: { name: "Acme staff" },
      project: SEED.project,
      machines: SEED.machines,
      branding: null,
    });
    expect(plan.apps).toEqual([
      {
        key: "console",
        kind: "bff",
        redirectUris: [
          `http://localhost:5173${CALLBACK}`,
          `https://console.staging.acme.example${CALLBACK}`,
        ],
        postLogoutRedirectUris: [],
        devMode: true,
        deviceCode: false,
        tokenExchange: false,
      },
      {
        key: "mobile",
        kind: "native",
        redirectUris: ["acme://auth/callback"],
        postLogoutRedirectUris: [],
        devMode: false,
        deviceCode: false,
        tokenExchange: true,
      },
      {
        key: "cli",
        kind: "native",
        redirectUris: [],
        postLogoutRedirectUris: [],
        devMode: false,
        deviceCode: true,
        tokenExchange: false,
      },
    ]);
  });

  it("plans the production instance from production only, with no dev mode", () => {
    const plan = identityPlan(ROOT, SEED, "prod");

    expect(plan.issuer).toBe("https://id.acme.example");
    expect(plan.apps.map((app) => [app.key, app.redirectUris, app.devMode])).toEqual([
      ["console", [`https://console.acme.example${CALLBACK}`], false],
      ["mobile", ["acme://auth/callback"], false],
      ["cli", ["http://127.0.0.1/callback"], false],
      ["web", [`https://www.acme.example${CALLBACK}`], false],
    ]);
    expect(plan.apps[0]?.postLogoutRedirectUris).toEqual(["https://console.acme.example/"]);
  });

  it("carries the seed's branding", () => {
    const palette = { primary: "#1f6feb", background: "#ffffff", warn: "#cf222e", font: "#1f2328" };
    const seed = parseIdentitySeed({ ...SEED, branding: { light: palette, dark: palette } });

    expect(identityPlan(ROOT, seed, "prod").branding).toEqual({ light: palette, dark: palette });
  });

  it("refuses a root runway without providers.zitadel", () => {
    expect(pathsOf(rootWith(), SEED, "prod")).toEqual(["root.providers.zitadel"]);
  });

  it("refuses an invalid providers.zitadel, naming the path", () => {
    expect(
      pathsOf(
        rootWith({ instances: { prod: { domain: "https://id.acme.example", environments: [] } } }),
        SEED,
        "prod",
      ),
    ).toEqual([
      "root.providers.zitadel.instances.prod.domain",
      "root.providers.zitadel.instances.prod.environments",
    ]);
  });

  it("refuses an instance the root runway does not declare", () => {
    expect(pathsOf(ROOT, SEED, "eu")).toEqual(["root.providers.zitadel.instances.eu"]);
  });

  it("refuses an http:// BFF callback on an instance that serves production", () => {
    const seed = seedWith("console", {
      kind: "bff",
      redirectUris: { production: [`http://console.acme.example${CALLBACK}`] },
    });

    expect(pathsOf(ROOT, seed, "prod")).toEqual(["seed.apps.console.redirectUris.production.0"]);
  });

  it("refuses a pattern, a relative URI, a fragment and a custom scheme on a BFF", () => {
    const seed = seedWith("console", {
      kind: "bff",
      redirectUris: {
        preview: [`https://console-pr-\${pr}.preview.acme.example${CALLBACK}`],
        staging: [
          CALLBACK,
          `https://console.staging.acme.example${CALLBACK}#done`,
          "acme://auth/callback",
        ],
      },
    });

    expect(pathsOf(ROOT, seed, "nonprod")).toEqual([
      "seed.apps.console.redirectUris.preview.0",
      "seed.apps.console.redirectUris.staging.0",
      "seed.apps.console.redirectUris.staging.1",
      "seed.apps.console.redirectUris.staging.2",
    ]);
  });

  it("refuses a native http:// callback off loopback", () => {
    const seed = seedWith("mobile", {
      kind: "native",
      redirectUris: { staging: ["http://[::1]:8400/callback", "http://callback.acme.example/"] },
    });

    expect(pathsOf(ROOT, seed, "nonprod")).toEqual(["seed.apps.mobile.redirectUris.staging.1"]);
  });

  it("checks only the callbacks of the instance's environments", () => {
    const seed = seedWith("console", {
      kind: "bff",
      redirectUris: {
        staging: [`https://console.staging.acme.example${CALLBACK}`],
        production: ["not a uri"],
      },
    });

    expect(identityPlan(ROOT, seed, "nonprod").apps.map((app) => app.key)).toEqual(["console"]);
  });
});
