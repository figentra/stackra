/**
 * Stackra file contract:
 * Purpose: unit tests of `IDENTITY_CONFIG_SCHEMA`: the defaults, the field rules (a flow keyed by a target, an absolute
 *          issuer or none, scope tokens with `openid`, an absolute BFF mount, a relative redirect path, a route
 *          reference, an idle rule a timer can hold), and no object-level refinement, so a member's generated schema
 *          can `.extend` it as the template's mobile sample does.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0206 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { IDENTITY_CONFIG_SCHEMA } from "#core/constants/identity-config-schema.constant";

describe("IDENTITY_CONFIG_SCHEMA", () => {
  it("parses nothing into the defaults", () => {
    expect(IDENTITY_CONFIG_SCHEMA.parse({})).toEqual({
      flow: { web: "bff", pwa: "bff", desktop: "pkce", ios: "pkce", android: "pkce" },
      issuer: "",
      clientId: "",
      scopes: ["openid", "profile", "email", "offline_access"],
      bffEndpoint: "/api/auth",
      csrfHeader: "x-stackra-csrf",
      nativeRedirectPath: "auth/callback",
      postLogoutRoute: null,
      idleMinutes: 0,
      refreshOnFocus: true,
      refreshOnForeground: true,
      externalProviders: {},
      externalProviderScope: "urn:zitadel:iam:org:idp:id:{id}",
      signInProvidersKey: "identity.sign_in_providers",
      assuranceByMethod: {
        pwd: "aal1",
        otp: "aal2",
        sms: "aal2",
        mfa: "aal2",
        swk: "aal2",
        user: "aal2",
        hwk: "aal3",
      },
      stepUpMaxAgeMinutes: 10,
      pinMinLength: 4,
      pinMaxLength: 8,
      pinHashIterations: 600_000,
      pinMaxAttempts: 5,
      pinLockoutMinutes: 15,
      managerOverrideSeconds: 120,
      apiKeyPrefixes: { secret: "stackra_sk", publishable: "stackra_pk" },
      apiKeyLastUsedSeconds: 60,
      verificationPackKey: "verification.drivers",
      signInTimeoutMinutes: 10,
      signInMethodsKey: "identity.sign_in_methods",
      appApprovalTtlSeconds: 60,
      appApprovalDigits: 2,
      appApprovalDecoys: 3,
      appApprovalEnrolledDevicesOnly: true,
      appApprovalMaxRequests: 5,
      appApprovalWindowMinutes: 15,
      appApprovalAssurance: "aal2",
      accountDeletionGraceDays: 30,
    });
  });

  it("accepts the template console's values", () => {
    const route = { key: "dashboard" };
    const parsed = IDENTITY_CONFIG_SCHEMA.parse({
      flow: { web: "bff", pwa: "bff", desktop: "pkce" },
      issuer: "https://id.acme.example",
      clientId: "312909075212468632",
      postLogoutRoute: route,
      idleMinutes: 30,
    });
    expect(parsed.flow).toEqual({ web: "bff", pwa: "bff", desktop: "pkce" });
    expect(parsed.postLogoutRoute).toBe(route);
    expect(parsed.idleMinutes).toBe(30);
  });

  it("extends as a member's generated override does", () => {
    const extended = IDENTITY_CONFIG_SCHEMA.extend({
      nativeRedirectPath: IDENTITY_CONFIG_SCHEMA.shape.nativeRedirectPath
        .unwrap()
        .default("auth/callback"),
      scopes: IDENTITY_CONFIG_SCHEMA.shape.scopes
        .unwrap()
        .default(() => ["openid", "urn:zitadel:iam:org:projects:roles"]),
      idleMinutes: IDENTITY_CONFIG_SCHEMA.shape.idleMinutes.unwrap().default(30),
      refreshOnForeground: IDENTITY_CONFIG_SCHEMA.shape.refreshOnForeground.unwrap().default(true),
    });
    const parsed = extended.parse({});
    expect(parsed.idleMinutes).toBe(30);
    expect(parsed.scopes).toEqual(["openid", "urn:zitadel:iam:org:projects:roles"]);
  });

  it.each([
    ["a flow keyed by an unknown target", { flow: { watch: "pkce" } }],
    ["an unknown flow", { flow: { web: "password" } }],
    ["a relative issuer", { issuer: "id.acme.example" }],
    ["scopes without openid", { scopes: ["profile"] }],
    ["a scope with a space", { scopes: ["openid", "two words"] }],
    ["a relative BFF mount", { bffEndpoint: "api/auth" }],
    ["a BFF mount with a query", { bffEndpoint: "/api/auth?x=1" }],
    ["an upper-case CSRF header", { csrfHeader: "X-Stackra-Csrf" }],
    ["an absolute redirect path", { nativeRedirectPath: "/auth/callback" }],
    ["a route given as a string", { postLogoutRoute: "/" }],
    ["a negative idle rule", { idleMinutes: -1 }],
    ["an idle rule past a day", { idleMinutes: 1441 }],
    ["a fractional idle rule", { idleMinutes: 1.5 }],
    ["a one-digit app approval number", { appApprovalDigits: 1 }],
    ["an app approval that lapses at once", { appApprovalTtlSeconds: 0 }],
    ["an unknown app approval assurance", { appApprovalAssurance: "aal9" }],
  ])("refuses %s", (_case, values) => {
    expect(IDENTITY_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });
});
