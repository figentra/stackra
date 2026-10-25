/**
 * Stackra file contract:
 * Purpose: `ConfigLayers<C>`, what `buildConfig` layers over a configuration after construction, in order: the
 *          environment (read through the class's `env` map), the values (runway's `config.<key>`, or a test's), then
 *          the secrets.
 * Boundary: a type only. The schema defaults and a host override are not layers here: construction applies them.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19); ADR 0296 (decision 1); ADR 0146 (decision 3, as amended).
 */
import type { Config } from "#core/bases/config.base";
import type { SecretStore } from "#core/ports/secret-store.port";
import type { ConfigValues } from "#core/types/config-values.type";

/** The layers applied after construction. */
export interface ConfigLayers<C extends Config> {
  /** The raw environment (`process.env`, `import.meta.env`, a Worker's bindings); only mapped variables are read. */
  readonly env?: Readonly<Record<string, unknown>>;

  /** Field values that win over the environment: runway's values for this key, or a test's. */
  readonly values?: Partial<ConfigValues<C>>;

  /** The store each `@Secret("NAME")` field is resolved from, by name. */
  readonly secrets?: SecretStore;
}
