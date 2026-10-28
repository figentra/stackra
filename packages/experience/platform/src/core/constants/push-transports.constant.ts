/**
 * Stackra file contract:
 * Purpose: `PUSH_TRANSPORTS`, the driver names of the `PlatformPushTransport` port, each a driver file prefix of this
 *          package: `memory` (`.`), `web` (`./browser`), `expo` and `self_hosted` (`./native`).
 * Boundary: internal data; it types `PushConfig.provider` through the `DriverRegistry` entry and checks it in the
 *           shipped schema. A new driver file adds its name here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */

/** The push transport driver names. */
export const PUSH_TRANSPORTS = ["memory", "web", "expo", "self_hosted"] as const;
