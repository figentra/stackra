/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the public surface of the `./contracts` entry of @stackra/navigation, the types and the
 *          enum a route overlay is described with. `stackra gen` replaces this file (STA-339).
 * Boundary: re-exports only; no logic.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0317.
 */
export { OverlayPresentation } from "#contracts/enums/overlay-presentation.enum";
export type { RouteLeaveConfirmationContractProps } from "#contracts/types/route-leave-confirmation-contract-props.type";
export type { RouteOverlayContractProps } from "#contracts/types/route-overlay-contract-props.type";
export type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
export type { RouteOverlayState } from "#contracts/types/route-overlay-state.type";
