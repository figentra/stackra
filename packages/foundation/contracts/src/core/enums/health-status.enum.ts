/**
 * Stackra file contract:
 * Purpose: `HealthStatus`, the state a `HealthIndicator` reports for one dependency: working, not working, or working
 *          below par.
 * Boundary: an `Enum.of` value plus the type of the same name. `Degraded` is still serving, so a probe may treat it as
 *           ready; `Down` is not.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0231 (snake_case codes); registry gaps R-27 and R-36 (owner
 *                     decision 23).
 */
import { Enum } from "#core/bases/enum.base";

/** The states a dependency reports. */
export const HealthStatus = Enum.of({
  /** Working. */
  Up: "up",
  /** Not working. */
  Down: "down",
  /** Working, but slow or partly failing. */
  Degraded: "degraded",
});

/** One of the codes above. */
export type HealthStatus = Enum.Value<typeof HealthStatus>;
