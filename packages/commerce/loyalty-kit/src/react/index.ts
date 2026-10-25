/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/loyalty-kit (the web renderers of the kit's two widgets,
 *          each with its Props) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; never reaches ./node or ./native. A renderer is bound to its
 *           widget by name, so a host mounts it without an import, and an app's shadow imports the Props from here.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (Props beside the component); the STA-347 stand-in barrel
 *                     decision.
 */
export { PointsBalance } from "#react/points-balance/points-balance";
export type { PointsBalanceProps } from "#react/points-balance/points-balance.props";
export { PointsIssued } from "#react/points-issued/points-issued";
export type { PointsIssuedProps } from "#react/points-issued/points-issued.props";
