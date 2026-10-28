/**
 * Stackra file contract:
 * Purpose: `ScreenViewed` (`screen.viewed`), the built-in analytics event `useScreenViews` tracks on each screen change
 *          of a native surface while `AnalyticsConfig.autocapturePageviews` is on.
 * Boundary: carries the screen (route) name only, never its params. Registers its own schema at load, the stand-in
 *           for what gen writes for an app's events. Delivered behind consent like any event.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 19 and 20); ADR 0298 (decision 5); analytics gap 9 (stackra-409).
 */
import { AnalyticsEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * A screen was viewed.
 *
 * @example
 * analytics.track(ScreenViewed.create({ screen: "orders.show" }));
 */
export class ScreenViewed extends AnalyticsEvent({ name: "screen.viewed" }) {
  /** The screen's route name. */
  screen!: string;
}

registerSchemas([[ScreenViewed, z.object({ screen: z.string().min(1).max(200) })]]);
