/**
 * Stackra file contract:
 * Purpose: `RadioButtonGroupProps`, props of the web RadioButtonGroup: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { RadioButtonGroupProps as HeroRadioButtonGroupProps } from "@heroui-pro/react/radio-button-group";

import type { RadioButtonGroupContractProps } from "#contracts/types/radio-button-group-contract-props.type";

/** Props of the web RadioButtonGroup: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RadioButtonGroupProps = RadioButtonGroupContractProps &
  Omit<HeroRadioButtonGroupProps, keyof RadioButtonGroupContractProps | "aria-label">;
