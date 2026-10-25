/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/navigation (the `RouteCaller` port) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 (route overlay); ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { RouteCaller } from "#contracts/ports/route-caller.port";
export { OverlayPresentation } from "#contracts/enums/overlay-presentation.enum";
export type { RouteLeaveConfirmationContractProps } from "#contracts/types/route-leave-confirmation-contract-props.type";
export type { RouteOverlayContractProps } from "#contracts/types/route-overlay-contract-props.type";
export type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
export type { RouteOverlayState } from "#contracts/types/route-overlay-state.type";
