/**
 * Stackra file contract:
 * Purpose: `runningEnvironment()`, the running environment of this server process through the one reader
 *          (`readEnvironment` of @stackra/config, STA-2844): `STACKRA_ENVIRONMENT` in `process.env` and what the
 *          serving platform reported to `providePlatformEnvironment`. `createApp` boots with it and the dev sign-in asks it on
 *          every call (`BearerTokenGuard`, `CallAuthenticator`), so the boot and the calls give the same answer and no
 *          configuration value takes part (STA-2795).
 * Boundary: reads `process.env` and `PLATFORM_ENVIRONMENT_HOST` only, and only through the reader; throws the reader's
 *           `ConfigInvalidError` (a typo, `dev` or `test` on a deployed platform, a platform that reports nothing).
 *           Internal: not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0296 (amendment 2026-11-26: the environment comes from the runtime only); ADR 0206
 *                     (amendment of 2026-11-26: the dev issuer); STA-2844; STA-2795.
 */
import { readEnvironment } from "@stackra/config";
import type { StackraEnvironment } from "@stackra/config";

import { PLATFORM_ENVIRONMENT_HOST } from "#server/constants/platform-environment-host.constant";

/**
 * The environment this process runs as.
 *
 * @throws ConfigInvalidError when the reader refuses the variable or the platform.
 * @example
 * const keys = devIssuerKeys(config, runningEnvironment()); // undefined in every deployed environment
 */
export function runningEnvironment(): StackraEnvironment {
  return readEnvironment(process.env, PLATFORM_ENVIRONMENT_HOST.current);
}
