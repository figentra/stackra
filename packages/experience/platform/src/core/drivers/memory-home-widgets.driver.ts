/**
 * Stackra file contract:
 * Purpose: `MemoryHomeWidgetsDriver`, the `HomeWidgets` driver of tests, the web and the desktop: the `memory`
 *          candidate; it keeps the last published glance so a test can read it.
 * Boundary: `isAvailable` false makes every `publish` resolve the `unavailable` refusal, as a target without widgets
 *           does. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); STA-1539.
 */
import { Driver } from "@stackra/container";

import { HomeWidgets } from "#contracts/ports/home-widgets.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { WidgetGlance } from "#contracts/types/widget-glance.type";
import { HOME_WIDGET_CAPABILITY } from "#core/constants/home-widget-capability.constant";
import { refuse } from "#core/functions/refuse.function";

/**
 * Widgets in memory.
 *
 * @example
 * const widgets = new MemoryHomeWidgetsDriver();
 * await widgets.publish({ title: "Orders", value: "42" });
 * expect(widgets.published?.value).toBe("42");
 */
export class MemoryHomeWidgetsDriver extends Driver(HomeWidgets) {
  /** Whether this target offers widgets; a test sets it. */
  isAvailable = true;

  /** The last published glance, or `undefined` before the first. */
  published: WidgetGlance | undefined;

  /** Keeps `glance`, or refuses when unavailable. */
  async publish(glance: WidgetGlance): Promise<CapabilityResult> {
    if (!this.isAvailable) return refuse(HOME_WIDGET_CAPABILITY, "unavailable");
    this.published = glance;
    return { ok: true, data: undefined };
  }
}
