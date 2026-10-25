/**
 * Stackra file contract:
 * Purpose: `PointsBalanceProps` of the native renderer of the points-balance widget.
 * Boundary: an interface in its own file beside the component, exported from the `./native` entry. Its fields are the
 *           web renderer's, field for field: the widget feeds both platforms the same data, so one contract has two
 *           implementations and no code is shared between them (the native entry never imports ./react).
 * Runtime: react-native
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
