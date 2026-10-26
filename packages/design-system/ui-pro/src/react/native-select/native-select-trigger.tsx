/**
 * Stackra file contract:
 * Purpose: `NativeSelect.Trigger` on HeroUI Pro's trigger (the browser's own `select` element): maps the contract's
 *          `label` to `aria-label` and `isDisabled` to the native `disabled` attribute.
 * Boundary: no behaviour of its own; the select props, `value`, `onChange` and `multiple` included, are HeroUI Pro's,
 *          passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import { NativeSelect as HeroNativeSelect } from "@heroui-pro/react/native-select";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { NativeSelectTriggerProps } from "#react/native-select/native-select-trigger.props";

/** The trigger: the `select` element that holds the options. */
export function NativeSelectTrigger({ label, isDisabled, ...rest }: NativeSelectTriggerProps) {
  return (
    <HeroNativeSelect.Trigger
      {...rest}
      {...omitUndefined({ disabled: isDisabled, "aria-label": label })}
    />
  );
}
