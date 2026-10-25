/**
 * Stackra file contract:
 * Purpose: `NotifierDriverName`, the driver names of the `Notifier` port (`memory`, `notifications`), registered under the port key
 *          `notifications.Notifier` so `NotificationsConfig.driver` type-checks in this package before any host's gen
 *          has run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names of the drivers this package ships, so
 *           it agrees with what gen writes for this port in a host's `#stackra/wiring`: `memory` in `.`, and
 *           `notifications` (queueing to the notifications service) in `./node`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a `DriverName<Port>` field); ADR 0263 (decision 9).
 */

/** The drivers of `Notifier`. */
export type NotifierDriverName = "memory" | "notifications";

declare module "@stackra/container" {
  interface DriverRegistry {
    "notifications.Notifier": NotifierDriverName;
  }
}
