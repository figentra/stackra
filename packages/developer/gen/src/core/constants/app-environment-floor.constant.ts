/**
 * Stackra file contract:
 * Purpose: `APP_ENVIRONMENT_FLOOR`, the first `@stackra/app` release whose `./server` exports
 *          `providePlatformEnvironment`, which the generated `stackra-encore/<member>/environment.ts` imports (STA-2844).
 *          Gen refuses a service whose declared `@stackra/app` is older (`app_version_floor`), so a new gen never writes
 *          an environment file the installed app cannot load (STA-1571).
 * Boundary: a version string, `major.minor.patch`. `checkServerEnvironment` asks for the lower of this and gen's own
 *           version, so gen never asks for a newer app than itself (the packages are released together).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (amendment 2026-11-26: the environment comes from the runtime only); ADR 0212
 *                     (decisions 1 and 4); STA-1571, STA-2844.
 */

/** The oldest `@stackra/app` a generated service may run on. */
export const APP_ENVIRONMENT_FLOOR = "0.34.0";
