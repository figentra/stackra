/**
 * Stackra file contract:
 * Purpose: `NOTIFICATIONS_CONFIG_SCHEMA`, the zod schema this package ships for `NotificationsConfig` (exported as
 *          `NotificationsConfig$`): the `Notifier` driver (`memory` or `notifications`) and the `notifications`
 *          driver's built-in target (`messages` or `delivery`).
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `NotificationsConfig$` extends it. The defaults equal
 *           `NotificationsOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0266 (decision 5: config picks the
 *                     driver); ADR 0422 (as amended by STA-1235).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's NotificationsOptions into #stackra/schemas; replace with STA-339.
/** The shipped `NotificationsConfig$`. */
export const NOTIFICATIONS_CONFIG_SCHEMA = z.object({
  driver: z.enum(["memory", "notifications"]).default("memory"),
  target: z.enum(["messages", "delivery"]).default("messages"),
});
