/**
 * Stackra file contract:
 * Purpose: `ConfigValues<C>`, the data fields of a configuration instance without its type-only brands: what a test's
 *          `.withConfig(Class, values)`, runway's layer and an env derivation are typed against.
 * Boundary: a type only. Methods and the `~kind`/`~config` brands drop out; fields are writable here because a layer
 *           sets them before the instance is frozen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19); ADR 0296 (decision 1: runway values); ADR 0269 (testing builder).
 */
import type { Config } from "#core/bases/config.base";

/** The data fields of `C`. */
export type ConfigValues<C extends Config> = {
  -readonly [
    K in keyof C as K extends "~kind" | "~config"
      ? never
      : C[K] extends (...args: never[]) => unknown
        ? never
        : K
  ]: C[K];
};
