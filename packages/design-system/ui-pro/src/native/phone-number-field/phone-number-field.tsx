/**
 * Stackra file contract:
 * Purpose: the native `PhoneNumberField` compound on HeroUI Native Pro's PhoneNumberField (a country picker and a
 *          formatted number input): the root maps `label` to `accessibilityLabel`; `value`, `country`, `countries`,
 *          `onValueChange` and every other prop pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes HeroUI Native Pro's own parts, and its
 *          `usePhoneNumberField` hook is re-exported as it is; validation uses `libphonenumber-js` when it is installed.
 *          `Label`, `Description` and `FieldError` come from `heroui-native`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import { PhoneNumberField as HeroPhoneNumberField } from "heroui-native-pro/phone-number-field";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { PhoneNumberFieldContractProps } from "#contracts/types/phone-number-field-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

export { usePhoneNumberField } from "heroui-native-pro/phone-number-field";

/**
 * Props of the native PhoneNumberField: the shared contract plus HeroUI Native Pro's own, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type PhoneNumberFieldProps = PhoneNumberFieldContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroPhoneNumberField>,
    keyof PhoneNumberFieldContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function PhoneNumberFieldRoot({ label, isDisabled, ...rest }: PhoneNumberFieldProps): ReactElement {
  return (
    <HeroPhoneNumberField {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface PhoneNumberFieldParts {
  /** The select state of the country picker. */
  readonly Select: typeof HeroPhoneNumberField.Select;
  /** The portal that mounts the country picker above the screen. */
  readonly Portal: typeof HeroPhoneNumberField.Portal;
  /** The dimmed layer behind the picker. */
  readonly Overlay: typeof HeroPhoneNumberField.Overlay;
  /** The popover or sheet that holds the country list. */
  readonly Content: typeof HeroPhoneNumberField.Content;
  /** The surface behind the content. */
  readonly ContentBackground: typeof HeroPhoneNumberField.ContentBackground;
  /** The drag handle of the sheet. */
  readonly ContentHandle: typeof HeroPhoneNumberField.ContentHandle;
  /** The pressable flag and dial code that opens the picker. */
  readonly Trigger: typeof HeroPhoneNumberField.Trigger;
  /** The search field inside the picker. */
  readonly SearchInput: typeof HeroPhoneNumberField.SearchInput;
  /** The list of countries. */
  readonly CountryList: typeof HeroPhoneNumberField.CountryList;
  /** One country of the list. */
  readonly CountryItem: typeof HeroPhoneNumberField.CountryItem;
  /** The row that holds the trigger, the prefix, the input and the suffix. */
  readonly InputGroup: typeof HeroPhoneNumberField.InputGroup;
  /** Content before the input. */
  readonly Prefix: typeof HeroPhoneNumberField.Prefix;
  /** The number input, formatted for the selected country. */
  readonly Input: typeof HeroPhoneNumberField.Input;
  /** Content after the input. */
  readonly Suffix: typeof HeroPhoneNumberField.Suffix;
}

/**
 * A country picker and a formatted number input: `PhoneNumberField.InputGroup` holds `PhoneNumberField.Trigger` and
 * `PhoneNumberField.Input`; `PhoneNumberField.Portal` holds the country list. Name it for screen readers with `label`.
 */
export const PhoneNumberField: typeof PhoneNumberFieldRoot & PhoneNumberFieldParts = Object.assign(
  PhoneNumberFieldRoot,
  {
    Select: HeroPhoneNumberField.Select,
    Portal: HeroPhoneNumberField.Portal,
    Overlay: HeroPhoneNumberField.Overlay,
    Content: HeroPhoneNumberField.Content,
    ContentBackground: HeroPhoneNumberField.ContentBackground,
    ContentHandle: HeroPhoneNumberField.ContentHandle,
    Trigger: HeroPhoneNumberField.Trigger,
    SearchInput: HeroPhoneNumberField.SearchInput,
    CountryList: HeroPhoneNumberField.CountryList,
    CountryItem: HeroPhoneNumberField.CountryItem,
    InputGroup: HeroPhoneNumberField.InputGroup,
    Prefix: HeroPhoneNumberField.Prefix,
    Input: HeroPhoneNumberField.Input,
    Suffix: HeroPhoneNumberField.Suffix,
  },
);
