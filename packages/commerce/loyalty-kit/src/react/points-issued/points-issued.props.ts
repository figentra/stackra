/**
 * Stackra file contract:
 * Purpose: `PointsIssuedProps`, what a host hands the web renderer of the points-issued widget.
 * Boundary: an interface in its own file beside the component, exported from the `./react` entry so an app's shadow
 *           takes the same Props. The data is the points-issued query's own output (`PointsIssuedView`, from core).
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 2 and 15); ADR 0305 (`<name>.props.ts`).
 */
import type { PointsIssuedView } from "#core/schemas/points-issued-view.schema";

/**
 * The bound query's output and the refresh state.
 *
 * @example
 * <PointsIssued data={{ earned: 420, redeemed: 60 }} isRefreshing={false} />
 */
export interface PointsIssuedProps {
  /** The bound query's output; undefined while loading. */
  readonly data?: PointsIssuedView;

  /** True while the host refreshes after points move. */
  readonly isRefreshing: boolean;
}
