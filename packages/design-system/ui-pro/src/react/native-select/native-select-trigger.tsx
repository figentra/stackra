/**
 * Stackra file contract:
 * Purpose: `NativeSelect.Trigger` on HeroUI Pro's trigger (the browser's own `select` element): maps the contract's
 *          `label` to `aria-label` and `isDisabled` to the native `disabled` attribute.
 * Boundary: no behaviour of its own; the select props, `value`, `onChange` and `multiple` included, are HeroUI Pro's,
 *          passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  NativeSelect as HeroNativeSelect,
  type NativeSelectTriggerProps as HeroNativeSelectTriggerProps,
} from "@heroui-pro/react/native-select";

import type { NativeSelectTriggerContractProps } from "#contracts/types/native-select-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the select trigger: the shared contract plus HeroUI Pro's own, with `disabled` and `aria-label` renamed. */
export type NativeSelectTriggerProps = NativeSelectTriggerContractProps &
  Omit<
    HeroNativeSelectTriggerProps,
    keyof NativeSelectTriggerContractProps | "disabled" | "aria-label"
  >;

/** The trigger: the `select` element that holds the options. */
export function NativeSelectTrigger({ label, isDisabled, ...rest }: NativeSelectTriggerProps) {
  return (
    <HeroNativeSelect.Trigger
      {...rest}
      {...omitUndefined({ disabled: isDisabled, "aria-label": label })}
    />
  );
}
