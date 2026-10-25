/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/loyalty-kit (the native renderer of the points-balance
 *          widget, with its Props) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; never reaches ./node or ./react. The points-issued widget is a
 *           staff dashboard tile and has no native renderer.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (Props beside the component); the STA-347 stand-in barrel
 *                     decision.
 */
export { PointsBalance } from "#native/points-balance/points-balance";
export type { PointsBalanceProps } from "#native/points-balance/points-balance.props";
