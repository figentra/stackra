/**
 * Stackra file contract:
 * Purpose: `ElementClicked` (`element.clicked`), the built-in analytics event `useAutocapture` tracks for a click
 *          inside an element carrying `data-track="<name>"` while `AnalyticsConfig.autocaptureClicks` is on.
 * Boundary: carries the author's `data-track` name and the page path only, never the element's text, value or
 *           attributes, so no page content or user input leaves the device. Registers its own schema at load.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 19 and 20); ADR 0298 (decision 5); ADR 0071; analytics gap 9 (stackra-409).
 */
import { AnalyticsEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { TRACK_NAME_PATTERN } from "#core/constants/track-name-pattern.constant";

/**
 * An element marked with `data-track` was clicked.
 *
 * @example
 * <button data-track="checkout.pay">Pay</button> // tracked as { target: "checkout.pay", path: "/checkout" }
 */
export class ElementClicked extends AnalyticsEvent({ name: "element.clicked" }) {
  /** The element's `data-track` name. */
  target!: string;

  /** The page path the click happened on, without query or hash. */
  path!: string;
}

registerSchemas([
  [
    ElementClicked,
    z.object({
      target: z.string().regex(TRACK_NAME_PATTERN),
      path: z.string().regex(/^\/[^?#]*$/),
    }),
  ],
]);
