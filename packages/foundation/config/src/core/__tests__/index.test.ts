/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/config`
 *          (`Config`, `Secret`, `env`, `hydrateEnv`) and the registry row's layering, key derivation, and error
 *          are exported, nothing else is (`MigrationRunner` left for @stackra/contracts), and the public types
 *          resolve, `BuildFacts` and `PublicPart` among them.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import * as config from "#core/index";
import type {
  BuildFacts,
  ConfigClass,
  ConfigIssue,
  ConfigLayers,
  ConfigOptions,
  ConfigValues,
  EnvDerivations,
  EnvMap,
  EnvValue,
  PublicPart,
} from "#core/index";

describe("@stackra/config", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(config).sort()).toEqual([
      "AwsSecretsManagerConfig",
      "AwsSecretsManagerConfig$",
      "AwsSecretsManagerOptions",
      "Config",
      "ConfigInvalidError",
      "InfisicalConfig",
      "InfisicalConfig$",
      "InfisicalOptions",
      "InfisicalSecretStoreDriver",
      "MemorySecretStoreDriver",
      "Secret",
      "buildConfig",
      "configKey",
      "env",
      "hydrateEnv",
    ]);
    expect("MigrationRunner" in config).toBe(false);
  });

  it("resolves its public types", () => {
    class Options extends Schema {
      siteUrl = "https://acme.example";

      posthogKey = "";
    }
    const Base = config.Config({ schema: Options, env: { posthogKey: "VITE_POSTHOG_KEY" } });
    class SiteConfig extends Base {}

    expectTypeOf(Base).toEqualTypeOf<
      ConfigClass<Options, { readonly posthogKey: "VITE_POSTHOG_KEY" }>
    >();
    expectTypeOf<ConfigOptions<Options, EnvMap<Options>>["schema"]>().toEqualTypeOf<
      AnyClass<Options>
    >();
    expectTypeOf<EnvMap<Options>>().toEqualTypeOf<{
      readonly siteUrl?: string;
      readonly posthogKey?: string;
    }>();
    expectTypeOf<ConfigValues<SiteConfig>>().toEqualTypeOf<{
      siteUrl: string;
      posthogKey: string;
    }>();
    expectTypeOf<keyof PublicPart<SiteConfig>>().toEqualTypeOf<"posthogKey">();
    expectTypeOf<EnvDerivations<SiteConfig>>().toHaveProperty("siteUrl");
    expectTypeOf<ConfigLayers<SiteConfig>>().toHaveProperty("secrets");
    expectTypeOf<BuildFacts["isDevelopment"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ConfigIssue["path"]>().toEqualTypeOf<string>();
    expectTypeOf<EnvValue<string>["parse"]>().returns.toEqualTypeOf<string>();
  });
});
