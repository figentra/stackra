/**
 * Stackra file contract:
 * Purpose: `Config`, the kind base of a configuration: `class X extends Config({ schema, env })`. The class is the DI
 *          token, its key is derived (`configKey`), and the schema's fields are typed on the class itself. The
 *          interface of the same name is its instance side.
 * Boundary: called only (`schema` is required). Constructing a configuration copies the schema's defaults onto it;
 *           a host override subclass (`override` members only, under the `Base<Name>` alias) applies next through its
 *           own initializers; the env, runway and secret layers apply after construction in `buildConfig`, which
 *           validates and freezes the instance. The kind keeps no other state.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 19, 20 and 25); ADR 0305 (rules 1 and 34); ADR 0146 as amended.
 */
import { createKind } from "@stackra/container";
import type { Schema } from "@stackra/validation";

import { configOptionsOf } from "#core/functions/config-options-of.function";
import type { ConfigClass } from "#core/types/config-class.type";
import type { ConfigOptions } from "#core/types/config-options.type";
import type { EnvMap } from "#core/types/env-map.type";

/** The instance side every configuration shares. */
export interface Config<S extends Schema = Schema, E extends EnvMap<S> = EnvMap<S>> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a configuration. */
  readonly "~kind": "config";

  /** Type-only: the schema and env map the class was declared with, read by `PublicPart`. */
  readonly "~config": { readonly schema: S; readonly env: E };
}

/**
 * The configuration kind base.
 *
 * @example
 * export class LoyaltyKitConfig extends Config({
 *   schema: LoyaltyKitOptions,
 *   env: { ledger: "STACKRA_LOYALTY_KIT_LEDGER" },
 * }) {}
 *
 * // a host, in src/overrides/loyalty-kit/loyalty-kit.config.ts
 * export class LoyaltyKitConfig extends BaseLoyaltyKitConfig {
 *   override maxRedeemPercent = 30;
 * }
 */
export const Config = createKind(
  "config",
  // The runtime base: copies the schema's defaults, so a host override's initializers apply on top of them.
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; its constructor is the copy
  class ConfigBase {
    constructor() {
      const { schema } = configOptionsOf(new.target);
      Object.assign(this, Reflect.construct(schema, []) as object);
    }
  },
) as <S extends Schema, const E extends EnvMap<S> = Record<never, never>>(
  options: ConfigOptions<S, E>,
) => ConfigClass<S, E>;
