/**
 * Stackra file contract:
 * Purpose: `PLATFORM_ENVIRONMENT_HOST`, what the serving platform reported about where this process runs, held between
 *          `providePlatformEnvironment` (the generated Encore `environment.ts`) and the server `createApp`, which reads
 *          the running environment through `readEnvironment` with it (STA-2844).
 * Boundary: internal; written only by `providePlatformEnvironment`. One platform per process, like the database url.
 * Runtime: node
 * Governing contract: ADR 0014 (decision 5: the runtime provides what it owns); ADR 0296 (amendment 2026-11-26);
 *                     STA-2844.
 */
import type { PlatformEnvironment } from "@stackra/config";

/** The platform's report, or undefined before `providePlatformEnvironment` (a hand-built app, a unit test). */
export const PLATFORM_ENVIRONMENT_HOST: { current: PlatformEnvironment | undefined } = {
  current: undefined,
};
