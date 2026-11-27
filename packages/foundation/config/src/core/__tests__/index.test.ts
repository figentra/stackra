/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/config`
 *          (`Config`, `Secret`, `env`, `hydrateEnv`), the registry row's layering, key derivation, and error, and the
 *          running environment's one reader (`readEnvironment`, STA-2844) are exported, nothing else is
 *          (`MigrationRunner` left for @stackra/contracts), and the public types resolve, `BuildFacts`, `PublicPart`
 *          and `PlatformEnvironment` among them, and the secret store reload and its configs (STA-258).
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
  LoadableSecretStore,
  PlatformEnvironment,
  PublicPart,
  SecretReload,
  SecretReloadOptions,
  StackraEnvironment,
} from "#core/index";

describe("@stackra/config", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(config).sort()).toEqual([
      "AwsSecretsManagerConfig",
      "AwsSecretsManagerConfig$",
      "AwsSecretsManagerOptions",
      "Config",
      "ConfigInvalidError",
      "ENVIRONMENT_VARIABLE",
      "EphemeralSignerDriver",
      "GcpSecretManagerConfig",
      "GcpSecretManagerConfig$",
      "GcpSecretManagerOptions",
      "KmsSignerDriver",
      "MemorySecretStoreDriver",
      "SAFETY_CRITICAL_VARIABLES",
      "Secret",
      "SecretFilesConfig",
      "SecretFilesConfig$",
      "SecretFilesOptions",
      "SecretsConfig",
      "SecretsConfig$",
      "SecretsOptions",
      "SignerConfig",
      "SignerConfig$",
      "SignerOptions",
      "StackraEnvironment",
      "buildConfig",
      "configKey",
      "env",
      "hydrateEnv",
      "isDeployedEnvironment",
      "readEnvironment",
      "scheduleSecretReload",
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
    expectTypeOf<PlatformEnvironment["cloud"]>().toEqualTypeOf<string>();
    expectTypeOf<StackraEnvironment>().toEqualTypeOf<
      "dev" | "test" | "preview" | "staging" | "production"
    >();
    expectTypeOf(config.readEnvironment).returns.toEqualTypeOf<StackraEnvironment>();
    expectTypeOf<LoadableSecretStore["load"]>().returns.toEqualTypeOf<Promise<void>>();
    expectTypeOf(config.scheduleSecretReload).returns.toEqualTypeOf<SecretReload>();
    expectTypeOf<SecretReloadOptions["everySeconds"]>().toEqualTypeOf<number>();
  });
});
