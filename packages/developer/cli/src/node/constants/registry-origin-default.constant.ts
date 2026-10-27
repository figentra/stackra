/**
 * Stackra file contract:
 * Purpose: `REGISTRY_ORIGIN_DEFAULT`, the Stackra registry's origin when nothing sets another: the default of the
 *          registry setting `registryOrigin` reads (`--registry`, `STACKRA_REGISTRY`, the workspace `.npmrc`).
 * Boundary: the default only; every command reads the origin through `registryOrigin`, never this constant.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 1: one host for the npm protocol and the catalogue API).
 */

/** The registry host of ADR 0453. */
export const REGISTRY_ORIGIN_DEFAULT = "https://npm.stackra.figentra.com/";
