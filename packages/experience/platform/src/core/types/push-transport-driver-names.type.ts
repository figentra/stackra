/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of the `PushTransport` port, so `PushConfig.provider` (typed
 *          `DriverName<PushTransport>`) and a runway `platform.push.provider` value take exactly this package's driver
 *          names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `PushOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { PUSH_TRANSPORTS } from "#core/constants/push-transports.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `PushTransport` (`memory`, `web`, `expo`, `self_hosted`). */
    "platform.PushTransport": (typeof PUSH_TRANSPORTS)[number];
  }
}
