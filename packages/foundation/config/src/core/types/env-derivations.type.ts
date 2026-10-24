/**
 * Stackra file contract:
 * Purpose: `EnvDerivations<C>`, the fallbacks gen writes for `hydrateEnv(C, raw, derivations)`: a field computed from
 *          the env-layered values before validation (`realtimeOrigin: (e) => e.realtimeOrigin || e.apiOrigin`).
 * Boundary: a type only. A derivation reads values and returns one; it never reads a secret, which is resolved after
 *           it runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 2 and 10).
 */
import type { Config } from "#core/bases/config.base";
import type { ConfigValues } from "#core/types/config-values.type";

/** Field to the function that computes it from the env-layered values. */
export type EnvDerivations<C extends Config> = {
  readonly [K in keyof ConfigValues<C>]?: (env: Readonly<ConfigValues<C>>) => ConfigValues<C>[K];
};
