/**
 * Stackra file contract:
 * Purpose: unit and type tests of `IdentityConfig`: the defaults, the derived key `identity`, the template's console and
 *          mobile overrides (`override` members under the `BaseIdentityConfig` alias) build and validate, and a bad
 *          value fails the boot with `ConfigInvalidError`.
 * Boundary: test only; builds through @stackra/config's `buildConfig`, as `createApp` does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19
 *                     and 20); ADR 0206 (decision 8).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { Target } from "@stackra/contracts";
import type { Url } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { AuthFlow } from "#core/enums/auth-flow.enum";

/** The package class under the alias a host imports it by. */
const BaseIdentityConfig = IdentityConfig;

/** A route reference, as the navigation package's `Routes.dashboard` is one. */
const DASHBOARD = Object.freeze({ key: "dashboard" });

/** The template console's override. */
class ConsoleIdentityConfig extends BaseIdentityConfig {
  override flow: Record<string, AuthFlow> = {
    [Target.Web]: AuthFlow.Bff,
    [Target.Pwa]: AuthFlow.Bff,
    [Target.Desktop]: AuthFlow.Pkce,
  };

  override bffEndpoint = "/api/auth";

  override postLogoutRoute: object = DASHBOARD;

  override idleMinutes = 30;

  override refreshOnFocus = true;

  override scopes = ["openid", "profile", "email", "offline_access"];

  override nativeRedirectPath = "auth/callback";
}

/** The template mobile app's override. */
class MobileIdentityConfig extends BaseIdentityConfig {
  override nativeRedirectPath = "auth/callback";

  override scopes = [
    "openid",
    "profile",
    "email",
    "offline_access",
    "urn:zitadel:iam:org:projects:roles",
  ];

  override idleMinutes = 30;

  override refreshOnForeground = true;
}

describe("IdentityConfig", () => {
  it("builds the defaults, frozen", () => {
    const config = buildConfig(IdentityConfig);
    expect(Object.isFrozen(config)).toBe(true);
    expect({ ...config }).toEqual({
      flow: { web: "bff", pwa: "bff", desktop: "pkce", ios: "pkce", android: "pkce" },
      issuer: "",
      clientId: "",
      scopes: ["openid", "profile", "email", "offline_access"],
      bffEndpoint: "/api/auth",
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
    });
  });

  it("types its fields on the class", () => {
    const config = new IdentityConfig();
    expectTypeOf(config.flow).toEqualTypeOf<Record<string, AuthFlow>>();
    expectTypeOf(config.issuer).toEqualTypeOf<Url | "">();
    expectTypeOf(config.scopes).toEqualTypeOf<string[]>();
    expectTypeOf(config.postLogoutRoute).toEqualTypeOf<object | null>();
    expectTypeOf(config.idleMinutes).toEqualTypeOf<number>();
    expectTypeOf(config.refreshOnForeground).toEqualTypeOf<boolean>();
  });

  it("derives the key identity, for the base and for a host override", () => {
    expect(configKey(IdentityConfig, "identity")).toBe("identity");
    expect(configKey(ConsoleIdentityConfig, "identity")).toBe("identity");
  });

  it("builds the console override on top of the defaults", () => {
    const config = buildConfig(ConsoleIdentityConfig);
    expect(config).toBeInstanceOf(IdentityConfig);
    expect(config.flow).toEqual({ web: "bff", pwa: "bff", desktop: "pkce" });
    expect(config.postLogoutRoute).toBe(DASHBOARD);
    expect(config.idleMinutes).toBe(30);
  });

  it("builds the mobile override on top of the defaults", () => {
    const config = buildConfig(MobileIdentityConfig);
    expect(config.scopes).toContain("urn:zitadel:iam:org:projects:roles");
    expect(config.bffEndpoint).toBe("/api/auth");
  });

  it("takes the device's public client per environment", () => {
    const config = buildConfig(IdentityConfig, {
      values: { issuer: "https://id.acme.example", clientId: "312909075212468632" },
    });
    expect(config.issuer).toBe("https://id.acme.example");
    expect(config.clientId).toBe("312909075212468632");
  });

  it.each([
    ["a flow for an unknown target", { flow: { watch: "pkce" } }],
    ["scopes without openid", { scopes: ["profile"] }],
    ["a relative BFF mount", { bffEndpoint: "api/auth" }],
    ["a negative idle rule", { idleMinutes: -5 }],
  ])("refuses %s at boot", (_case, values) => {
    expect(() =>
      buildConfig(IdentityConfig, {
        // The values are invalid on purpose; the boot check, not the type, must refuse them.
        values: values as Partial<ConfigValues<IdentityConfig>>,
      }),
    ).toThrow(ConfigInvalidError);
  });
});
