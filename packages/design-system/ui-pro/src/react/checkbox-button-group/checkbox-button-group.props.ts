/**
 * Stackra file contract:
 * Purpose: `CheckboxButtonGroupProps`, props of the web CheckboxButtonGroup: the shared contract plus HeroUI Pro's
 *          own, with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { CheckboxButtonGroupProps as HeroCheckboxButtonGroupProps } from "@heroui-pro/react/checkbox-button-group";

import type { CheckboxButtonGroupContractProps } from "#contracts/types/checkbox-button-group-contract-props.type";

/** Props of the web CheckboxButtonGroup: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type CheckboxButtonGroupProps = CheckboxButtonGroupContractProps &
  Omit<HeroCheckboxButtonGroupProps, keyof CheckboxButtonGroupContractProps | "aria-label">;
