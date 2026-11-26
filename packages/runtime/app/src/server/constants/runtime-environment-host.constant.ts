/**
 * Stackra file contract:
 * Purpose: `RUNTIME_ENVIRONMENT_HOST`, the serving runtime's environment, held between `provideRuntimeEnvironment`
 *          (the generated Encore `environment.ts`) and the server `createApp`, which derives the running Stackra
 *          environment from it (`runningEnvironment`).
 * Boundary: internal; written only by `provideRuntimeEnvironment`. One runtime per process, like the database url.
 * Runtime: node
 * Governing contract: ADR 0014 (decision 5: the runtime provides what it owns); ADR 0212 (decisions 1 and 4),
 *                     STA-1571.
 */
import type { RuntimeEnvironment } from "#server/types/runtime-environment.type";

/** The provided runtime environment, or undefined before `provideRuntimeEnvironment` (a hand-built test app). */
export const RUNTIME_ENVIRONMENT_HOST: { current: RuntimeEnvironment | undefined } = {
  current: undefined,
};
