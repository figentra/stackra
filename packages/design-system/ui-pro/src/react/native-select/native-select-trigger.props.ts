/**
 * Stackra file contract:
 * Purpose: `NativeSelectTriggerProps`, props of the select trigger: the shared contract plus HeroUI Pro's own, with
 *          `disabled` and `aria-label` renamed.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { NativeSelectTriggerProps as HeroNativeSelectTriggerProps } from "@heroui-pro/react/native-select";

import type { NativeSelectTriggerContractProps } from "#contracts/types/native-select-trigger-contract-props.type";

/** Props of the select trigger: the shared contract plus HeroUI Pro's own, with `disabled` and `aria-label` renamed. */
export type NativeSelectTriggerProps = NativeSelectTriggerContractProps &
  Omit<
    HeroNativeSelectTriggerProps,
    keyof NativeSelectTriggerContractProps | "disabled" | "aria-label"
  >;
