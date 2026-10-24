/**
 * Stackra file contract:
 * Purpose: `buildConfig`, how the runtime (`createApp`) and the testing module make the one instance of a
 *          configuration class: the schema defaults, a host override, the environment, runway's values, then the
 *          secrets, validated once and frozen. The container receives it as the override of the class.
 * Boundary: builds; it binds nothing. The order is fixed (ADR 0294 decision 19, ADR 0296 decision 1); a nested object
 *           in a later layer replaces the earlier one whole. Secrets are resolved blind through the `SecretStore` the
 *           runtime binds and are never serialised.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19); ADR 0296 (decision 1); ADR 0146 as amended; ADR 0173; ADR 0263.
 */
import type { Config } from "#core/bases/config.base";
import { layerConfig } from "#core/functions/layer-config.function";
import { sealConfig } from "#core/functions/seal-config.function";
import type { ConfigLayers } from "#core/types/config-layers.type";

/**
 * The validated, frozen instance of `type`.
 *
 * @throws ConfigInvalidError when a value breaks its rule or a required secret is missing (named, never printed).
 * @throws TypeError when `type` is not a configuration, a layer sets a `@Secret` field, or the schema has no
 *         registered generated schema.
 * @example
 * const config = buildConfig(LoyaltyKitConfig, {
 *   env: process.env,
 *   values: runway.config["loyalty_kit"],
 *   secrets: container.get(SecretStore),
 * });
 */
export function buildConfig<C extends Config>(type: new () => C, layers: ConfigLayers<C> = {}): C {
  const { secrets } = layers;
  return sealConfig(
    type,
    layerConfig(type, layers.env, layers.values),
    secrets === undefined ? undefined : (name) => secrets.get(name),
  ) as C;
}
