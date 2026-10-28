/**
 * Stackra file contract:
 * Purpose: `PageViewed` (`page.viewed`), the built-in analytics event `useAutocapture` tracks on each route change of
 *          a web surface while `AnalyticsConfig.autocapturePageviews` is on.
 * Boundary: carries the path only, never the query or the hash (they can hold tokens or personal data). Registers its
 *           own schema at load, the stand-in for what gen writes for an app's events. Delivered behind consent like
 *           any event.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 19 and 20); ADR 0298 (decision 5); analytics gap 9 (stackra-409).
 */
import { AnalyticsEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * A page was viewed.
 *
 * @example
 * analytics.track(PageViewed.create({ path: "/pricing" }));
 */
export class PageViewed extends AnalyticsEvent({ name: "page.viewed" }) {
  /** The page path, starting with `/`, without query or hash. */
  path!: string;
}

registerSchemas([[PageViewed, z.object({ path: z.string().regex(/^\/[^?#]*$/) })]]);
