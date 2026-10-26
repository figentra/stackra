/**
 * Stackra file contract:
 * Purpose: `RouteLeaveConfirmationProps`, the props of the web `RouteLeaveConfirmation`: the shared contract.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0317 (decision 2).
 */
import type { RouteLeaveConfirmationContractProps } from "#contracts/types/route-leave-confirmation-contract-props.type";

/** Props of the web RouteLeaveConfirmation: the shared contract, which has no element of its own to pass props to. */
export type RouteLeaveConfirmationProps = RouteLeaveConfirmationContractProps;
