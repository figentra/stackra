/**
 * Stackra file contract:
 * Purpose: `ExternalCustomerDisplayDriver`, the `CustomerDisplay` driver of the native till app
 *          (`peripherals.customerDisplay: "external"`): it hands each view to the package's `StackraCustomerDisplay`
 *          Expo module, which draws it on the display plugged into the tablet: an Android `Presentation` on Android,
 *          an external-display scene on the iPad. Moved here from `@stackra/peripherals` (ADR 0478 decision 5).
 * Boundary: delivers only. It refuses with capability `window` where the module is absent (a web or desktop build, an
 *           app built without this package) or no external display is connected; a module call that fails is that
 *           refusal too, never a thrown error at the till. The module is read from the Expo modules registry at call
 *           time, so this driver loads with no native package.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0430 (decision 1); ADR 0339 (open question 3); ADR 0344
 *                     (open spike 1, STA-475); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import { CustomerDisplay } from "@stackra/peripherals/contracts";
import type { CustomerDisplayView } from "@stackra/peripherals/contracts";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { customerDisplayModule } from "#core/functions/customer-display-module.function";
import type { CustomerDisplayNativeModule } from "#core/types/customer-display-native-module.type";

/** The refusal of every call that no external display can honour. */
const REFUSED = {
  ok: false,
  error: { code: "unavailable", capability: PlatformCapability.Window },
} as const satisfies CapabilityResult;

/**
 * The customer display on the tablet's external screen.
 *
 * @example
 * // generated native wiring
 * { port: CustomerDisplay, selectedBy: "config:peripherals.customerDisplay", candidates: { external: () => import("@stackra/native-customer-display").then((m) => m.ExternalCustomerDisplayDriver) } }
 */
export class ExternalCustomerDisplayDriver extends Driver(CustomerDisplay) {
  /** Answers while the module is there and a display is connected. */
  async probe(): Promise<CapabilityResult> {
    return this.call(async () => undefined);
  }

  /** Draws the view on the external display. */
  async show(view: CustomerDisplayView): Promise<CapabilityResult> {
    return this.call((module) => module.show(JSON.stringify(view)));
  }

  /** Shows the idle screen. */
  async clear(): Promise<CapabilityResult> {
    return this.call((module) => module.clear());
  }

  /** Runs `work` on the module when a display is connected, or refuses. */
  private async call(
    work: (module: CustomerDisplayNativeModule) => Promise<void>,
  ): Promise<CapabilityResult> {
    const module = customerDisplayModule();
    if (module === undefined) return REFUSED;
    try {
      if (!(await module.isAvailable())) return REFUSED;
      await work(module);
      return { ok: true, data: undefined };
    } catch {
      return REFUSED;
    }
  }
}
