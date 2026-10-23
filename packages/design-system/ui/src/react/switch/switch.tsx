/**
 * Stackra file contract:
 * Purpose: the web `Switch` on HeroUI v3's Switch (React Aria): maps the shared field contract (`value` to
 *          `isSelected`, `defaultValue` to `defaultSelected`, `onChange` with the new state) and draws the control,
 *          its label, description and error message in HeroUI's own structure; every other HeroUI prop passes through.
 * Boundary: no styling of its own. The label is the accessible name, so a switch with none takes `aria-label`.
 *          HeroUI's string `value` (what a form submits when on) is refused: the contract's `value` is the state.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7);
 *          ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Label, Switch as HeroSwitch } from "@heroui/react";
import type { SwitchRootProps } from "@heroui/react";

import type { SwitchContractProps } from "#contracts/types/switch-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web Switch: the shared contract plus HeroUI v3's own switch props, passed through unchanged. HeroUI's
 * `isSelected`, `defaultSelected`, string `value` and `children` are refused: the contract names each of them once.
 */
export type SwitchProps = SwitchContractProps &
  Omit<SwitchRootProps, keyof SwitchContractProps | "isSelected" | "defaultSelected" | "children">;

/**
 * A toggle for a setting that takes effect at once. `label` names it; `description` and `errorMessage` sit under the
 * control and are read out with it. The thumb moves toward the end of the reading direction when on, so it follows
 * right-to-left on its own.
 */
export function Switch({
  label,
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  name,
  ...rest
}: SwitchProps) {
  return (
    <HeroSwitch
      {...rest}
      {...omitUndefined({
        isSelected: value,
        defaultSelected: defaultValue,
        onChange,
        isRequired,
        isInvalid,
        isDisabled,
        isReadOnly,
        name,
      })}
    >
      <HeroSwitch.Content>
        <HeroSwitch.Control>
          <HeroSwitch.Thumb />
        </HeroSwitch.Control>
        {label ? (
          <Label {...omitUndefined({ isRequired, isInvalid, isDisabled })}>{label}</Label>
        ) : null}
      </HeroSwitch.Content>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroSwitch>
  );
}
