/**
 * Stackra file contract:
 * Purpose: `ExternalCustomerDisplayDriver`, the `CustomerDisplay` driver of the native till app
 *          (`peripherals.customerDisplay: "external"`): it hands each view to the app's `StackraCustomerDisplay`
 *          module, which draws it on the display plugged into the tablet: an Android `Presentation` on Android, an
 *          external-display scene on the iPad.
 * Boundary: delivers only. It refuses with capability `window` where the module is absent (a web or desktop build, an
 *           app built without it) or no external display is connected; a module call that fails is that refusal too,
 *           never a thrown error at the till. The module is read from the Expo modules registry at call time, so this
 *           driver needs no native package to load.
 * Runtime: isomorphic
 * Governing contract: ADR 0430 (decision 1); ADR 0339 (open question 3); ADR 0344 (open spike 1, STA-475); ADR 0250
 *                     (decision 3).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { CustomerDisplay } from "#contracts/ports/customer-display.port";
import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import { refuse } from "#core/functions/refuse.function";
import type { CustomerDisplayNativeModule } from "#core/types/customer-display-native-module.type";

/** The Expo modules registry, where an Expo app's native modules are. */
interface ExpoGlobal {
  readonly expo?: { readonly modules?: Readonly<Record<string, unknown>> };
}

/**
 * The customer display on the tablet's external screen.
 *
 * @example
 * // generated native wiring
 * { port: CustomerDisplay, selectedBy: "config:peripherals.customerDisplay", candidates: { external: () => import("@stackra/peripherals").then((m) => m.ExternalCustomerDisplayDriver) } }
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
    const module = (globalThis as ExpoGlobal).expo?.modules?.["StackraCustomerDisplay"] as
      | CustomerDisplayNativeModule
      | undefined;
    if (module === undefined) return refuse(Capability.Window, "unavailable");
    try {
      if (!(await module.isAvailable())) return refuse(Capability.Window, "unavailable");
      await work(module);
      return { ok: true, data: undefined };
    } catch {
      return refuse(Capability.Window, "unavailable");
    }
  }
}
