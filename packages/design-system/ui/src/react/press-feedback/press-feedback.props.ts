/**
 * Stackra file contract:
 * Purpose: `PressFeedbackProps`, the props of the web `PressFeedback` in `press-feedback.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ButtonProps as AriaButtonProps } from "react-aria-components";
import type { PressFeedbackContractProps } from "#contracts/types/press-feedback-contract-props.type";

/** Props of the web PressFeedback: the shared contract plus the root's own props, passed through. */
export type PressFeedbackProps = PressFeedbackContractProps &
  Omit<AriaButtonProps, keyof PressFeedbackContractProps | "aria-label">;
