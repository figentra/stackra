/**
 * Stackra file contract:
 * Purpose: the native `ModeSwitch`: the `Switch` that turns the developer display mode on and off, reporting the mode.
 * Boundary: on is developer, off is normal. Controlled by `mode` or starting from `defaultMode`; holds no other state.
 * Runtime: react-native
 * Governing contract: ADR 0359 (decisions 1 and 2); ADR 0302 (decision 3).
 */
import type { ReactElement } from "react";

import type { ModeSwitchContractProps } from "#contracts/types/mode-switch-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Switch } from "#native/switch/switch";

/** Props of the native ModeSwitch. */
export type ModeSwitchProps = ModeSwitchContractProps;

/** The developer-mode toggle. */
export function ModeSwitch({
  label,
  description,
  mode,
  defaultMode,
  onModeChange,
  isDisabled,
}: ModeSwitchProps): ReactElement {
  return (
    <Switch
      label={label}
      {...omitUndefined({
        description,
        isDisabled,
        value: mode === undefined ? undefined : mode === "developer",
        defaultValue: defaultMode === undefined ? undefined : defaultMode === "developer",
        onChange:
          onModeChange === undefined
            ? undefined
            : (on: boolean) => onModeChange(on ? "developer" : "normal"),
      })}
    />
  );
}
