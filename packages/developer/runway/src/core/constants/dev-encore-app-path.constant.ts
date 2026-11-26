/**
 * Stackra file contract:
 * Purpose: `DEV_ENCORE_APP_PATH`, the folder of the local monolith app relative to the repository root: the one Encore
 *          app of every service member that root `stackra dev` runs (`syncDevEncoreApp`).
 * Boundary: frozen data; under `.stackra/`, which every repository gitignores.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 3); ADR 0091 (decision 2); STA-2840.
 */

/** The local monolith app, relative to the repository root. */
export const DEV_ENCORE_APP_PATH = ".stackra/dev/encore";
