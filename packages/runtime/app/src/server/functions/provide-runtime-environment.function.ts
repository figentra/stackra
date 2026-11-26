/**
 * Stackra file contract:
 * Purpose: `provideRuntimeEnvironment`, which the runtime calls with where it runs before the server app boots: the
 *          generated `stackra-encore/<member>/environment.ts` passes Encore's `appMeta().environment`, so `createApp`
 *          derives the running Stackra environment (`STACKRA_ENVIRONMENT`) on a deployment that cannot set it (Encore
 *          Cloud has no plain environment variables) and refuses `dev` or `test` there (STA-1571).
 * Boundary: replaces the previous value; reads nothing else.
 * Runtime: node
 * Governing contract: ADR 0014 (decision 5); ADR 0091 and 0124 (Encore stays outside the service program); ADR 0212
 *                     (decisions 1 and 4), STA-1571.
 */
import { RUNTIME_ENVIRONMENT_HOST } from "#server/constants/runtime-environment-host.constant";
import type { RuntimeEnvironment } from "#server/types/runtime-environment.type";

/**
 * Provides the runtime environment `createApp` derives the running environment from.
 *
 * @param runtime - the serving runtime's environment (Encore's `appMeta().environment`).
 * @example
 * provideRuntimeEnvironment(appMeta().environment);
 */
export function provideRuntimeEnvironment(runtime: RuntimeEnvironment): void {
  RUNTIME_ENVIRONMENT_HOST.current = {
    name: runtime.name,
    type: runtime.type,
    cloud: runtime.cloud,
  };
}
