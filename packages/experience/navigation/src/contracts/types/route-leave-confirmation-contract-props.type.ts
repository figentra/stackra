/**
 * Stackra file contract:
 * Purpose: the props every runtime's `RouteLeaveConfirmation` takes: `LeaveConfirmation`'s own (whether there is
 *          unsaved work, the words of the "discard your changes?" dialog) without its `ref`, because the component
 *          asks through the router blocker itself and nobody else needs the handle.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 2); ADR 0312; WCAG 2.2 SC 3.3.4.
 */
import type { LeaveConfirmationContractProps } from "@stackra/ui/contracts";

/** Props shared by the web and native `RouteLeaveConfirmation`. */
export type RouteLeaveConfirmationContractProps = Omit<LeaveConfirmationContractProps, "ref">;
