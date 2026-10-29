/**
 * Stackra file contract:
 * Purpose: the `HomeWidgets` port: the data the app's home-screen and Lock Screen widget shows, published by the app
 *          into the shared app group so the widget reads it while the app is closed.
 * Boundary: an abstract class that is its own token, keyed `platform.HomeWidgets`; a driver per target implements it
 *           with `extends Driver(HomeWidgets)` (memory, Expo). A target without widgets (Android for now, the web)
 *           resolves the `unavailable` refusal, never an exception. The last published glance replaces the one before.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0478 (decision 9: Expo's widget library); STA-1539.
 */
import { Port } from "@stackra/contracts";

import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { WidgetGlance } from "#contracts/types/widget-glance.type";

/**
 * Feeds the app's widget.
 *
 * @example
 * const widgets = useContainer().get(HomeWidgets);
 * await widgets.publish({ title: t("orders::widget.title"), value: String(count), caption: t("orders::widget.today") });
 */
export abstract class HomeWidgets extends Port {
  /** Type-only port key, so `DriverName<HomeWidgets>` narrows to this port's drivers. */
  declare readonly "~key": "platform.HomeWidgets";

  /** Shows `glance` in every placed widget from now on. */
  abstract publish(glance: WidgetGlance): Promise<CapabilityResult>;
}
