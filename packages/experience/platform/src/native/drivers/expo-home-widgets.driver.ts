/**
 * Stackra file contract:
 * Purpose: `ExpoHomeWidgetsDriver`, the `HomeWidgets` driver of the Expo (phone) target: publishes a glance to the
 *          `Glance` home-screen and Lock Screen widget through expo-widgets, which keeps it in the shared app group.
 * Boundary: iOS only; Android resolves `unavailable` until expo-widgets' Android support leaves its opt-in, and so
 *           does a publish the OS refuses (an Expo Go session, no app group). The widget extension target and the app
 *           group come from expo-widgets' config plugin, listed in the app config by gen.
 * Runtime: react-native
 * Governing contract: ADR 0250 (decision 3); ADR 0478 (decision 9); ADR 0294 (decision 17); STA-1539.
 */
import { Driver } from "@stackra/container";
import { Platform as Os } from "react-native";

import { HomeWidgets } from "#contracts/ports/home-widgets.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { WidgetGlance } from "#contracts/types/widget-glance.type";
import { HOME_WIDGET_CAPABILITY } from "#core/constants/home-widget-capability.constant";
import { refuse } from "#core/functions/refuse.function";
import { GLANCE_WIDGET } from "#native/constants/glance-widget.constant";

/**
 * Widgets on a phone.
 *
 * @example
 * // generated wiring, expo target
 * { port: HomeWidgets, candidates: { expo: () => import("@stackra/platform/native").then((m) => m.ExpoHomeWidgetsDriver) } }
 */
export class ExpoHomeWidgetsDriver extends Driver(HomeWidgets) {
  /** Writes `glance` into the app group and reloads the placed widgets. */
  async publish(glance: WidgetGlance): Promise<CapabilityResult> {
    if (Os.OS !== "ios") return refuse(HOME_WIDGET_CAPABILITY, "unavailable");
    try {
      GLANCE_WIDGET.updateSnapshot(glance);
      return { ok: true, data: undefined };
    } catch {
      return refuse(HOME_WIDGET_CAPABILITY, "unavailable");
    }
  }
}
