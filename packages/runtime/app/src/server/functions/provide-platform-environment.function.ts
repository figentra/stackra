/**
 * Stackra file contract:
 * Purpose: `providePlatformEnvironment(platform, env?)`, which the generated Encore `environment.ts` calls with
 *          Encore's `appMeta().environment` before any generated file loads the server app: it reads the running
 *          environment through the one reader (`readEnvironment` of @stackra/config), records the platform for
 *          `createApp`, and settles `STACKRA_ENVIRONMENT` in the runtime environment to that answer, so every later
 *          reader of the variable (a configuration class, a generated relay table) sees the deployment, never an unset
 *          `dev`. A deployed Encore service cannot set the variable itself (Encore Cloud has no plain environment
 *          variables), so without this it read as `dev` and kept dev-only drivers (STA-2844).
 * Boundary: throws `ConfigInvalidError` from the reader (a typo, `dev` or `test` on a deployed platform, a platform
 *           that reports nothing and no variable), which fails the process at import. Writes only
 *           `STACKRA_ENVIRONMENT`, and only in `env`.
 * Runtime: node
 * Governing contract: ADR 0014 (decision 5); ADR 0091 and 0124 (Encore stays in the generated app); ADR 0296
 *                     (amendment 2026-11-26: the environment comes from the runtime only); STA-2844.
 */
import { ENVIRONMENT_VARIABLE, readEnvironment } from "@stackra/config";
import type { PlatformEnvironment, StackraEnvironment } from "@stackra/config";

import { PLATFORM_ENVIRONMENT_HOST } from "#server/constants/platform-environment-host.constant";

/**
 * Records the platform and settles the running environment in `env`.
 *
 * @param platform - what the serving platform reports (Encore's `appMeta().environment`).
 * @param env - the runtime environment to settle the variable in; `process.env` by default.
 * @returns the running environment.
 * @throws ConfigInvalidError when the reader refuses the variable or the platform.
 * @example
 * providePlatformEnvironment(appMeta().environment); // "production" on an Encore Cloud production environment
 */
export function providePlatformEnvironment(
  platform: PlatformEnvironment,
  env: Record<string, string | undefined> = process.env,
): StackraEnvironment {
  const reported = { name: platform.name, type: platform.type, cloud: platform.cloud };
  const environment = readEnvironment(env, reported);
  PLATFORM_ENVIRONMENT_HOST.current = reported;
  env[ENVIRONMENT_VARIABLE] = environment;
  return environment;
}
