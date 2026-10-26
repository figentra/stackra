/**
 * Stackra file contract:
 * Purpose: `RouteOverlayProps`, the props of the native `RouteOverlay`: the shared contract.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0317 (decisions 2 and 9).
 */
import type { RouteOverlayContractProps } from "#contracts/types/route-overlay-contract-props.type";

/** Props of the native RouteOverlay: the shared contract, in which `size` is unread (the platform sizes modals). */
export type RouteOverlayProps = RouteOverlayContractProps;
