/**
 * Stackra file contract:
 * Purpose: `CONFIG_TESTING_PLUGIN`, the testing-module plugin of @stackra/config: `.withConfig(Class, values)` builds
 *          the configuration with `values` as its last layer and puts it in place of the class (and of the base class
 *          a host override stands in for); `.withSecrets(map)` binds a `SecretStore` that answers from `map`. Both
 *          chain methods are declared on `TestingModuleBuilder` here and registered when this module loads.
 * Boundary: builds through `buildConfig`, so values are validated as at boot. Calls may come in any order: each call
 *           rebuilds every configuration the builder holds. A secret a test did not set reads as
 *           `test-secret:<NAME>` inside a configuration, so a test that does not care about it needs no
 *           `.withSecrets`; the bound `SecretStore` itself answers only the names given.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0263 (decision 12); the STA-348 registry row (builder extension point).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingModuleBuilder, TestingPlugin } from "@stackra/container/testing";

import { configRoot } from "#core/functions/config-root.function";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { buildConfig } from "#core/index";
import type { Config, ConfigValues } from "#core/index";

declare module "@stackra/container/testing" {
  interface TestingModuleBuilder {
    /**
     * Builds `type` with `values` over its defaults and puts it in place of the class for every class that injects it.
     * Calls for the same class add up.
     */
    withConfig<C extends Config>(type: new () => C, values: Partial<ConfigValues<C>>): this;

    /** Binds a `SecretStore` answering from `secrets` by name; calls add up. */
    withSecrets(secrets: Readonly<Record<string, string>>): this;
  }
}

/** What one builder has been given. */
interface ConfigTestingState {
  readonly secrets: Record<string, string>;
  readonly configs: Map<new () => Config, object>;
}

/** The state of each builder. */
const STATES = new WeakMap<TestingModuleBuilder, ConfigTestingState>();

/** The state of `builder`, created on first use. */
function stateOf(builder: TestingModuleBuilder): ConfigTestingState {
  const known = STATES.get(builder);
  if (known !== undefined) return known;
  const state: ConfigTestingState = { secrets: {}, configs: new Map() };
  STATES.set(builder, state);
  return state;
}

/** A `SecretStore` answering through `get`. */
const storeOf = (get: (name: string) => string | undefined): SecretStore =>
  Object.assign(Object.create(SecretStore.prototype) as SecretStore, { get });

/** Rebuilds every configuration the builder holds and puts each in place of its class and its base. */
function apply(builder: TestingModuleBuilder, state: ConfigTestingState): TestingModuleBuilder {
  const secrets = storeOf((name) => state.secrets[name] ?? `test-secret:${name}`);
  for (const [type, values] of state.configs) {
    const config = buildConfig(type, { values, secrets });
    builder.override(type, config);
    const base = configRoot(type);
    if (base !== type) builder.override(base, config);
  }
  return builder;
}

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * const app = await createTestingModule(LoyaltyKitModule)
 *   .withConfig(LoyaltyKitConfig, { ledger: "memory", maxRedeemPercent: 30 })
 *   .withSecrets({ RESEND_WEBHOOK_SECRET: "whsec_test" })
 *   .compile();
 */
export const CONFIG_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/config",
  builder: {
    withConfig(this: TestingModuleBuilder, type: new () => Config, values: object) {
      const state = stateOf(this);
      state.configs.set(type, { ...state.configs.get(type), ...values });
      return apply(this, state);
    },
    withSecrets(this: TestingModuleBuilder, secrets: Readonly<Record<string, string>>) {
      const state = stateOf(this);
      Object.assign(state.secrets, secrets);
      this.override(
        SecretStore,
        storeOf((name) => state.secrets[name]),
      );
      return apply(this, state);
    },
  },
};

registerTestingPlugin(CONFIG_TESTING_PLUGIN);
