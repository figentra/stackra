/**
 * Stackra file contract:
 * Purpose: `CustomerDisplayMessage`, what travels on the customer display channel: a view to show, or a clear.
 * Boundary: a type only; JSON, so it crosses the window boundary unchanged. The display side checks the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1).
 */
import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";

/** One message to the display. */
export type CustomerDisplayMessage =
  | {
      /** Show `view`. */
      readonly type: "show";
      /** The view. */
      readonly view: CustomerDisplayView;
    }
  | {
      /** Clear the display. */
      readonly type: "clear";
    };
