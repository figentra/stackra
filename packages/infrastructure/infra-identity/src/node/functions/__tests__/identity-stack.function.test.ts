/**
 * Stackra file contract:
 * Purpose: unit tests of `identityStack` under Pulumi mocks: the provider points at the plan's domain, the instance
 *          gets the ten-minute token lifetimes, the 12-character password rule and the branding, the staff
 *          organisation gets its MFA sign-in policy, the project its roles, each app one PKCE client with no secret
 *          and its extra grants, each machine user its instance and project roles; the outputs carry the client and
 *          user ids; an unset provisioner key fails naming it; Apple is off by default, and on it is one Apple identity
 *          provider with the plan's ids whose key comes from the named secret.
 * Boundary: test only; `runtime.setMocks` and `runtime.setAllConfig` stand in for the engine and the stack config,
 *           so nothing reaches ZITADEL.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decisions 2 to 4); ADR 0206 (decision 8); ADR 0207
 *                     (decision 3); ADR 0274 (decision 5); ADR 0277 (decisions 2 and 4); STA-1578.
 */
import { all, runtime } from "@pulumi/pulumi";
import type { Output } from "@pulumi/pulumi";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import type { IdentityPlan } from "#core/types/identity-plan.type";
import { identityStack } from "#node/functions/identity-stack.function";
import type { IdentityStack } from "#node/types/identity-stack.type";

const PALETTE = { primary: "#1f6feb", background: "#ffffff", warn: "#cf222e", font: "#1f2328" };
const DARK = { primary: "#4493f8", background: "#0d1117", warn: "#f85149", font: "#f0f6fc" };

/** The non-production instance's plan, as `identityPlan` builds it. */
const PLAN: IdentityPlan = {
  instance: "nonprod",
  domain: "id.staging.acme.example",
  issuer: "https://id.staging.acme.example",
  environments: ["dev", "preview", "staging"],
  org: { name: "Acme staff" },
  project: {
    name: "acme-platform",
    roles: [{ key: "platform_admin", name: "Platform administrator", group: "platform" }],
  },
  apps: [
    {
      key: "console",
      kind: "bff",
      redirectUris: [
        "http://localhost:5173/api/auth/callback",
        "https://console.staging.acme.example/api/auth/callback",
      ],
      postLogoutRedirectUris: ["https://console.staging.acme.example/"],
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
  ],
  machines: {
    identity: {
      name: "Identity service",
      instanceRoles: ["org_manager"],
      roles: ["platform_admin"],
    },
  },
  branding: { light: PALETTE, dark: DARK },
  appleSignIn: null,
};

/** The Apple ids the owner creates (placeholders) and the name of the key's stack config secret. */
const APPLE = {
  teamId: "TEAM000001",
  serviceId: "example.acme.signin",
  keyId: "KEY0000001",
  privateKeySecret: "APPLE_SIGN_IN_KEY",
};

/** One registered resource: its class (the last segment of its type token), name and resolved inputs. */
type Registered = { kind: string; name: string; inputs: Record<string, unknown> };

const registered: Registered[] = [];

/** The resolved value of an output. */
function valueOf<T>(output: Output<T>): Promise<T> {
  return new Promise((resolve) => {
    output.apply(resolve);
  });
}

/** Waits until every resource of the stack is registered. */
async function settle(stack: IdentityStack): Promise<void> {
  await valueOf(
    all([
      stack.firstPartyClients,
      all([stack.orgId, stack.projectId, ...Object.values(stack.machines)]),
    ]),
  );
  await new Promise((resolve) => {
    setTimeout(resolve, 10);
  });
}

/** The inputs of the one resource of `kind` named `name`. */
function inputsOf(kind: string, name: string): Record<string, unknown> | undefined {
  return registered.find((resource) => resource.kind === kind && resource.name === name)?.inputs;
}

beforeEach(async () => {
  registered.length = 0;
  await runtime.setMocks(
    {
      newResource: (args) => {
        registered.push({
          kind: args.type.split(":").at(-1) ?? args.type,
          name: args.name,
          inputs: args.inputs as Record<string, unknown>,
        });
        return {
          id: `${args.name}-id`,
          state: { ...args.inputs, clientId: `${args.name}-client` },
        };
      },
      call: () => ({}),
    },
    "infra",
    "identity-nonprod",
    true,
  );
  runtime.setAllConfig({ "zitadel:jwtProfileJson": '{"type":"serviceaccount"}' });
});

describe("identityStack", () => {
  it("points the provider at the plan's domain", async () => {
    await settle(identityStack(PLAN));

    expect(inputsOf("zitadel", "zitadel")).toMatchObject({ domain: "id.staging.acme.example" });
  });

  it("sets the instance's token lifetimes, password rule and branding", async () => {
    await settle(identityStack(PLAN));

    expect(inputsOf("DefaultOidcSettings", "oidc")).toEqual({
      accessTokenLifetime: "10m0s",
      idTokenLifetime: "10m0s",
      refreshTokenExpiration: "720h0m0s",
      refreshTokenIdleExpiration: "720h0m0s",
    });
    expect(inputsOf("DefaultPasswordComplexityPolicy", "password")).toMatchObject({
      minLength: 12,
      hasUppercase: false,
      hasSymbol: false,
    });
    expect(inputsOf("DefaultLabelPolicy", "branding")).toMatchObject({
      primaryColor: "#1f6feb",
      backgroundColorDark: "#0d1117",
      setActive: true,
    });
  });

  it("keeps ZITADEL's branding when the plan has none", async () => {
    await settle(identityStack({ ...PLAN, branding: null }));

    expect(registered.map((resource) => resource.kind)).not.toContain("DefaultLabelPolicy");
  });

  it("creates the staff organisation with a forced second factor and no sign-up", async () => {
    await settle(identityStack(PLAN));

    expect(inputsOf("Org", "staff")).toEqual({ name: "Acme staff" });
    expect(inputsOf("LoginPolicy", "staff-login")).toMatchObject({
      orgId: "staff-id",
      allowRegister: false,
      forceMfa: true,
      passwordCheckLifetime: "12h0m0s",
      mfaInitSkipLifetime: "0s",
    });
  });

  it("creates the project with role assertion and its roles", async () => {
    await settle(identityStack(PLAN));

    expect(inputsOf("Project", "project")).toMatchObject({
      orgId: "staff-id",
      name: "acme-platform",
      projectRoleAssertion: true,
    });
    expect(inputsOf("ProjectRole", "role-platform_admin")).toEqual({
      orgId: "staff-id",
      projectId: "project-id",
      roleKey: "platform_admin",
      displayName: "Platform administrator",
      group: "platform",
    });
  });

  it("creates one PKCE client per app with no secret and its extra grants", async () => {
    await settle(identityStack(PLAN));

    expect(inputsOf("ApplicationOidc", "app-console")).toMatchObject({
      projectId: "project-id",
      name: "console",
      appType: "OIDC_APP_TYPE_WEB",
      authMethodType: "OIDC_AUTH_METHOD_TYPE_NONE",
      grantTypes: ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE", "OIDC_GRANT_TYPE_REFRESH_TOKEN"],
      redirectUris: PLAN.apps[0]?.redirectUris,
      postLogoutRedirectUris: ["https://console.staging.acme.example/"],
      devMode: true,
      accessTokenType: "OIDC_TOKEN_TYPE_JWT",
    });
    expect(inputsOf("ApplicationOidc", "app-mobile")).toMatchObject({
      appType: "OIDC_APP_TYPE_NATIVE",
      grantTypes: [
        "OIDC_GRANT_TYPE_AUTHORIZATION_CODE",
        "OIDC_GRANT_TYPE_REFRESH_TOKEN",
        "OIDC_GRANT_TYPE_TOKEN_EXCHANGE",
      ],
      devMode: false,
    });
    expect(inputsOf("ApplicationOidc", "app-cli")?.["grantTypes"]).toContain(
      "OIDC_GRANT_TYPE_DEVICE_CODE",
    );
  });

  it("creates the machine users with their instance and project roles", async () => {
    await settle(identityStack(PLAN));

    expect(inputsOf("MachineUser", "machine-identity")).toMatchObject({
      orgId: "staff-id",
      userName: "identity",
      name: "Identity service",
      accessTokenType: "ACCESS_TOKEN_TYPE_JWT",
    });
    expect(inputsOf("InstanceMember", "machine-identity-instance")).toEqual({
      userId: "machine-identity-id",
      roles: ["IAM_ORG_MANAGER"],
    });
    expect(inputsOf("UserGrant", "machine-identity-grant")).toEqual({
      orgId: "staff-id",
      projectId: "project-id",
      userId: "machine-identity-id",
      roleKeys: ["platform_admin"],
    });
  });

  it("exports the issuer and the ids, with every client first-party", async () => {
    const stack = identityStack(PLAN);
    await settle(stack);

    expect(stack.issuer).toBe("https://id.staging.acme.example");
    expect(await valueOf(stack.orgId)).toBe("staff-id");
    expect(await valueOf(stack.projectId)).toBe("project-id");
    expect(await valueOf(all(stack.clients))).toEqual({
      console: "app-console-client",
      mobile: "app-mobile-client",
      cli: "app-cli-client",
    });
    expect(await valueOf(all(stack.machines))).toEqual({ identity: "machine-identity-id" });
    expect(await valueOf(stack.firstPartyClients)).toEqual([
      "app-console-client",
      "app-mobile-client",
      "app-cli-client",
    ]);
  });

  it("creates no Apple identity provider unless the plan turns it on", async () => {
    const stack = identityStack(PLAN);
    await settle(stack);

    expect(stack.appleIdp).toBeNull();
    expect(registered.map((resource) => resource.name)).not.toContain("apple-idp");
  });

  it("creates the Apple identity provider with the plan's ids and exports its id", async () => {
    runtime.setAllConfig({
      "zitadel:jwtProfileJson": '{"type":"serviceaccount"}',
      "zitadel:APPLE_SIGN_IN_KEY": "p8",
    });
    const stack = identityStack({ ...PLAN, appleSignIn: APPLE });
    await settle(stack);

    expect(inputsOf("Resource", "apple-idp")).toMatchObject({
      domain: "id.staging.acme.example",
      clientId: "example.acme.signin",
      teamId: "TEAM000001",
      keyId: "KEY0000001",
    });
    expect(stack.appleIdp === null ? null : await valueOf(stack.appleIdp)).toBe("apple-idp-id");
  });

  it("fails when the Apple key's secret is not in the stack config, naming it", () => {
    expect(() => identityStack({ ...PLAN, appleSignIn: APPLE })).toThrow(
      "zitadel:APPLE_SIGN_IN_KEY",
    );
  });

  it("fails when the provisioner key is not in the stack config, naming it", () => {
    runtime.setAllConfig({});

    expect(() => identityStack(PLAN)).toThrow("zitadel:jwtProfileJson");
  });
});
