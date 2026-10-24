/**
 * Stackra file contract:
 * Purpose: `ConfigOptions<S, E>`, what `Config(...)` takes: the shape class whose fields, types and defaults the
 *          configuration has, and the optional map of fields read from the environment.
 * Boundary: a type only. An `env` key that is not a field of the schema is a type error (`never`), so a typo never
 *           reaches boot.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 34); ADR 0294 (decision 19).
 */
import type { AnyClass } from "@stackra/container";
import type { Fields, Schema } from "@stackra/validation";

import type { EnvMap } from "#core/types/env-map.type";

/** The options of a configuration class. */
export interface ConfigOptions<S extends Schema, E extends EnvMap<S>> {
  /** The shape class in `schemas/` (`LoyaltyKitOptions`): fields, types, defaults and `@Secret` fields. */
  readonly schema: AnyClass<S>;

  /** Field to environment variable; only fields of `schema`. */
  readonly env?: E & { readonly [K in Exclude<keyof E, keyof Fields<S>>]: never };
}
