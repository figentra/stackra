/**
 * Stackra file contract:
 * Purpose: `PressFeedbackProps`, the props of the native `PressFeedback` in `press-feedback.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { PressableFeedbackProps } from "heroui-native";
import type { PressFeedbackContractProps } from "#contracts/types/press-feedback-contract-props.type";

/** Props of the native PressFeedback: the shared contract plus the root's own props, passed through. */
export type PressFeedbackProps = PressFeedbackContractProps &
  Omit<PressableFeedbackProps, keyof PressFeedbackContractProps>;
