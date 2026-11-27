/**
 * Stackra file contract:
 * Purpose: `REGISTRY_ORIGIN_DEFAULT`, the Stackra registry's origin when nothing sets another: the default of the
 *          registry setting `registryOrigin` reads (`--registry`, `STACKRA_REGISTRY`, the workspace `.npmrc`).
 * Boundary: the default only; every command reads the origin through `registryOrigin`, never this constant.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 1: one host for the npm protocol and the catalogue API).
 */

/**
 * The registry's main host (ADR 0025, ADR 0453, STA-2892). The registry also answers on `npm.stackra.figentra.com`,
 * permanently, so a workspace whose `.npmrc` names that host keeps working.
 */
export const REGISTRY_ORIGIN_DEFAULT = "https://npm.figentra.com/";
