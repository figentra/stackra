/**
 * Stackra file contract:
 * Purpose: `STACKRA_REGISTRY_DEFAULT`, the Stackra registry's origin when neither `--registry` nor `STACKRA_REGISTRY`
 *          names another. Kept equal to `@stackra/cli`'s `REGISTRY_ORIGIN_DEFAULT`: this package installs from npmjs
 *          with no `@stackra/*` dependency, so it cannot import that constant.
 * Boundary: the default only; `bootstrapRegistry` is the one reader.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 1: one registry host).
 */

/** The registry host of ADR 0453. */
export const STACKRA_REGISTRY_DEFAULT = "https://npm.stackra.figentra.com/";
