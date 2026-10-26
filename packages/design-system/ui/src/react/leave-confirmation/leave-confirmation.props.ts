/**
 * Stackra file contract:
 * Purpose: `LeaveConfirmationProps`, the props of the web `LeaveConfirmation` in `leave-confirmation.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; ADR 0055
 *          (forms); WCAG 2.2 SC 3.3.4.
 */
import type { LeaveConfirmationContractProps } from "#contracts/types/leave-confirmation-contract-props.type";

/** Props of the web LeaveConfirmation: the shared contract, which has no element of its own to pass props to. */
export type LeaveConfirmationProps = LeaveConfirmationContractProps;
