/**
 * Stackra file contract:
 * Purpose: `PressableFeedbackProps`, props of the web PressableFeedback: the shared contract plus HeroUI Pro's own
 *          pressable props (those of a `button`, bar its native `disabled`, which `isDisabled` replaces), passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { PressableFeedbackRootProps } from "@heroui-pro/react/pressable-feedback";
import type { ComponentPropsWithoutRef } from "react";

import type { PressableFeedbackContractProps } from "#contracts/types/pressable-feedback-contract-props.type";

/**
 * Props of the web PressableFeedback: the shared contract plus HeroUI Pro's own pressable props (those of a
 * `button`, bar its native `disabled`, which `isDisabled` replaces), passed through unchanged.
 */
export type PressableFeedbackProps = PressableFeedbackContractProps &
  Omit<PressableFeedbackRootProps<"button">, keyof PressableFeedbackContractProps> &
  Omit<
    ComponentPropsWithoutRef<"button">,
    keyof PressableFeedbackRootProps<"button"> | keyof PressableFeedbackContractProps | "disabled"
  >;
