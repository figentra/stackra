/**
 * Stackra file contract:
 * Purpose: the `SecondScreen` port: a window of the app on a second display (the till's customer-facing display), opened
 *          on a route of the app and closed again, each as a `CapabilityResult` that refuses with capability `window`
 *          when no second display is connected.
 * Boundary: an abstract class that is its own token, keyed `platform.SecondScreen`. It only places the window; what the
 *           window shows and how it is fed (the `channel` customer display of `@stackra/peripherals`) is the route's
 *           business. The route is a path of the app's own origin.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (open question 3: the customer display's second Electron window); ADR 0344; ADR 0250
 *                     (decision 3); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { CapabilityResult } from "#contracts/types/capability-result.type";

/**
 * A window on the second display.
 *
 * @example
 * const opened = await secondScreen.open("/customer-display");
 * if (!opened.ok) toast.info(t(I18n.console.capabilities[opened.error.code]));
 */
export abstract class SecondScreen extends Port {
  /** Type-only port key, so `DriverName<SecondScreen>` narrows to this port's drivers. */
  declare readonly "~key": "platform.SecondScreen";

  /** Whether a second display is connected now. */
  abstract probe(): Promise<CapabilityResult>;

  /** Opens (or moves) the window on the second display at `route`, a path starting with `/`. */
  abstract open(route: string): Promise<CapabilityResult>;

  /** Closes the window; succeeds when none is open. */
  abstract close(): Promise<CapabilityResult>;
}
