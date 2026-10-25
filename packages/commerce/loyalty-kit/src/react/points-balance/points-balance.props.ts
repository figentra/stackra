/**
 * Stackra file contract:
 * Purpose: `PointsBalanceProps`, what a host hands the web renderer of the points-balance widget.
 * Boundary: an interface in its own file beside the component (one declaration per file), exported from the `./react`
 *           entry so an app's shadow of `PointsBalance` takes the same Props. The data is the balance query's own output
 *           (`BalanceView`, from core). The native renderer's Props carry the same fields: one contract, two
 *           implementations.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 2 and 15); ADR 0305 (`<name>.props.ts`); ADR 0302.
 */
import type { BalanceView } from "#core/schemas/balance-view.schema";

/**
 * The bound query's output and the refresh state.
 *
 * @example
 * <PointsBalance data={balance} isRefreshing={false} />
 */
export interface PointsBalanceProps {
  /** The bound query's output; undefined while loading. */
  readonly data?: BalanceView;

  /** True while the host refreshes the widget. */
  readonly isRefreshing: boolean;
}
