/**
 * Stackra file contract:
 * Purpose: unit tests of `parseIdentitySeed`: a minimal seed gets every default, a full seed passes as written, and
 *          every failure (an unknown key, another version, a bad role code or colour, a role declared twice or held but
 *          not declared, the device code or token exchange on a BFF) is one `IdentityInfraInvalidError` naming its
 *          path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0206 (decisions 5 and 8); ADR 0208 (role codes).
 */
import { describe, expect, it } from "@stackra/testing";

import { IdentityInfraInvalidError } from "#core/errors/identity-infra-invalid.error";
import { parseIdentitySeed } from "#core/functions/parse-identity-seed.function";

/** The paths a failing document reports. */
function pathsOf(document: unknown): string[] {
  try {
    parseIdentitySeed(document);
  } catch (error) {
    if (error instanceof IdentityInfraInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  return [];
}

const PALETTE = { primary: "#1f6feb", background: "#ffffff", warn: "#cf222e", font: "#1f2328" };

/** A seed with one of everything. */
const FULL = {
  version: 1,
  org: { name: "Acme staff" },
  project: {
    name: "acme-platform",
    roles: [
      { key: "platform_admin", name: "Platform administrator", group: "platform" },
      { key: "member", name: "Member" },
    ],
  },
  apps: {
    console: {
      kind: "bff",
      redirectUris: { staging: ["https://console.staging.acme.example/api/auth/callback"] },
      postLogoutRedirectUris: { staging: ["https://console.staging.acme.example/"] },
    },
    mobile: {
      kind: "native",
      redirectUris: { staging: ["acme://auth/callback"] },
      tokenExchange: true,
    },
  },
  machines: {
    identity: {
      name: "Identity service",
      instanceRoles: ["org_manager"],
      roles: ["platform_admin"],
    },
  },
  users: [
    {
      userName: "dev",
      email: "dev@acme.example",
      firstName: "Dev",
      lastName: "User",
      roles: ["member"],
    },
  ],
  branding: { light: PALETTE, dark: PALETTE },
};

describe("parseIdentitySeed", () => {
  it("fills every default of a minimal seed", () => {
    expect(
      parseIdentitySeed({
        version: 1,
        org: { name: "Acme staff" },
        project: { name: "acme-platform" },
      }),
    ).toEqual({
      version: 1,
      org: { name: "Acme staff" },
      project: { name: "acme-platform", roles: [] },
      apps: {},
      machines: {},
      users: [],
    });
  });

  it("passes a full seed as written, with the app defaults filled", () => {
    const seed = parseIdentitySeed(FULL);

    expect(seed.apps["console"]).toEqual({
      ...FULL.apps.console,
      deviceCode: false,
      tokenExchange: false,
    });
    expect(seed.apps["mobile"]).toEqual({
      ...FULL.apps.mobile,
      postLogoutRedirectUris: {},
      deviceCode: false,
    });
    expect(seed.machines).toEqual(FULL.machines);
    expect(seed.users).toEqual(FULL.users);
    expect(seed.branding).toEqual(FULL.branding);
  });

  it("names the source in the error", () => {
    expect(() => parseIdentitySeed({ version: 2 }, ".stackra/zitadel/seed.yaml")).toThrow(
      /^\.stackra\/zitadel\/seed\.yaml is invalid: /,
    );
  });

  it("refuses an unknown key, another version, a bad role code and a bad colour", () => {
    const paths = pathsOf({
      ...FULL,
      version: 2,
      project: { name: "acme-platform", roles: [{ key: "Platform-Admin", name: "Admin" }] },
      branding: { light: { ...PALETTE, primary: "blue" }, dark: PALETTE },
      tenants: [],
    });

    expect(paths).toEqual(
      expect.arrayContaining(["", "version", "project.roles.0.key", "branding.light.primary"]),
    );
  });

  it("refuses a role declared twice or held but not declared", () => {
    expect(
      pathsOf({
        ...FULL,
        project: {
          name: "acme-platform",
          roles: [
            { key: "member", name: "Member" },
            { key: "member", name: "Member again" },
          ],
        },
      }),
    ).toEqual(["project.roles.1.key", "machines.identity.roles.0"]);
  });

  it("refuses the device code and token exchange on a BFF", () => {
    expect(
      pathsOf({
        ...FULL,
        apps: {
          console: { kind: "bff", deviceCode: true },
          web: { kind: "bff", tokenExchange: true },
        },
      }),
    ).toEqual(["apps.console.kind", "apps.web.kind"]);
  });
});
