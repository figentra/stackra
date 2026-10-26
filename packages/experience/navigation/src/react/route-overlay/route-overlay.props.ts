/**
 * Stackra file contract:
 * Purpose: `RouteOverlayProps`, the props of the web `RouteOverlay`: the shared contract.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0317 (decisions 2 and 9).
 */
import type { RouteOverlayContractProps } from "#contracts/types/route-overlay-contract-props.type";

/** Props of the web RouteOverlay: the shared contract, which has no element of its own to pass props to. */
export type RouteOverlayProps = RouteOverlayContractProps;
