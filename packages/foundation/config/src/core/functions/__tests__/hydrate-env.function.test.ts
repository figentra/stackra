/**
 * Stackra file contract:
 * Purpose: unit and type tests of `hydrateEnv`: `{ only: "public" }` returns only the fields mapped to public-prefixed
 *          variables (never a server value or a secret) plus `isDevelopment`, typed `PublicPart<C> & BuildFacts`; the
 *          whole form returns the validated instance with its secrets resolved by name from the same raw environment
 *          and its derivations applied; a missing or malformed value fails naming the variable.
 * Boundary: test only; the fixtures mirror the template's web and console env configurations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0295 (decisions 2 and
 *                     10); ADR 0231 (decision 4); ADR 0173.
 */
import type { Url } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas, Schema, url } from "@stackra/validation";
import { z } from "zod";

import { Config } from "#core/bases/config.base";
import { Secret } from "#core/decorators/secret.decorator";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { hydrateEnv } from "#core/functions/hydrate-env.function";
import type { BuildFacts } from "#core/types/build-facts.type";
import type { PublicPart } from "#core/types/public-part.type";

class EnvOptions extends Schema {
  @Secret("TURNSTILE_SECRET_KEY")
  turnstileSecret!: string;

  analyticsPosthogKey = "";

  turnstileSiteKey!: string;

  apiUrl!: Url;

  realtimeOrigin = "";
}

registerSchemas([
  [
    EnvOptions,
    z.object({
      analyticsPosthogKey: z.string().default(""),
      turnstileSiteKey: z.string().min(1),
      apiUrl: url(),
      realtimeOrigin: z.string().default(""),
      turnstileSecret: z.string(),
    }),
  ],
]);

class EnvConfig extends Config({
  schema: EnvOptions,
  env: {
    analyticsPosthogKey: "VITE_POSTHOG_KEY",
    turnstileSiteKey: "VITE_TURNSTILE_SITE_KEY",
    apiUrl: "STACKRA_API_URL",
    realtimeOrigin: "STACKRA_REALTIME_ORIGIN",
  },
}) {}

const RAW = {
  VITE_POSTHOG_KEY: "phc_public",
  VITE_TURNSTILE_SITE_KEY: "0x4AAAA",
  STACKRA_API_URL: "https://api.acme.example",
  TURNSTILE_SECRET_KEY: "turnstile_secret_canary",
  DEV: true,
  MODE: "development",
};

describe("hydrateEnv", () => {
  it("returns only the public fields and the build facts", () => {
    const env = hydrateEnv(EnvConfig, RAW, { only: "public" });
    expect(env).toEqual({
      analyticsPosthogKey: "phc_public",
      turnstileSiteKey: "0x4AAAA",
      isDevelopment: true,
    });
    expect(Object.isFrozen(env)).toBe(true);
    expect(JSON.stringify(env)).not.toContain("canary");
    expect(JSON.stringify(env)).not.toContain("api.acme.example");
    expectTypeOf(env).toEqualTypeOf<PublicPart<EnvConfig> & BuildFacts>();
    expectTypeOf<keyof typeof env>().toEqualTypeOf<
      "analyticsPosthogKey" | "turnstileSiteKey" | "isDevelopment"
    >();
  });

  it("derives isDevelopment from the build mode", () => {
    const production = { ...RAW, DEV: false, MODE: "production" };
    expect(hydrateEnv(EnvConfig, production, { only: "public" }).isDevelopment).toBe(false);
    expect(
      hydrateEnv(
        EnvConfig,
        { ...production, MODE: undefined, NODE_ENV: "development" },
        { only: "public" },
      ).isDevelopment,
    ).toBe(true);
  });

  it("fails on a missing public value, naming its variable", () => {
    expect(() =>
      hydrateEnv(EnvConfig, { STACKRA_API_URL: "https://api.acme.example" }, { only: "public" }),
    ).toThrow(/VITE_TURNSTILE_SITE_KEY/);
  });

  it("returns the whole validated instance with its secrets resolved from the raw environment", () => {
    const env = hydrateEnv(EnvConfig, RAW);
    expect(env).toBeInstanceOf(EnvConfig);
    expect(Object.isFrozen(env)).toBe(true);
    expect(env.apiUrl).toBe("https://api.acme.example");
    expect(env.turnstileSecret).toBe("turnstile_secret_canary");
    expect(JSON.stringify(env)).not.toContain("canary");
    expectTypeOf(env).toEqualTypeOf<EnvConfig>();
  });

  it("applies the derivations gen writes before validating", () => {
    const env = hydrateEnv(EnvConfig, RAW, {
      realtimeOrigin: (e) => e.realtimeOrigin || e.apiUrl,
    });
    expect(env.realtimeOrigin).toBe("https://api.acme.example");
    const explicit = hydrateEnv(
      EnvConfig,
      { ...RAW, STACKRA_REALTIME_ORIGIN: "wss://rt.acme.example" },
      { realtimeOrigin: (e) => e.realtimeOrigin || e.apiUrl },
    );
    expect(explicit.realtimeOrigin).toBe("wss://rt.acme.example");
  });

  it("fails on a missing or malformed value, naming the variable", () => {
    const withoutApi = { ...RAW, STACKRA_API_URL: undefined };
    expect(() => hydrateEnv(EnvConfig, withoutApi)).toThrow(ConfigInvalidError);
    expect(() => hydrateEnv(EnvConfig, withoutApi)).toThrow(/STACKRA_API_URL/);
    expect(() => hydrateEnv(EnvConfig, { ...RAW, STACKRA_API_URL: "not a url" })).toThrow(
      /STACKRA_API_URL/,
    );
    const withoutSecret = { ...RAW, TURNSTILE_SECRET_KEY: undefined };
    expect(() => hydrateEnv(EnvConfig, withoutSecret)).toThrow(/secret TURNSTILE_SECRET_KEY/);
  });
});
