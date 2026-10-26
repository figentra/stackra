/**
 * Stackra file contract:
 * Purpose: the native `DateField` compound on HeroUI Native Pro's DateField (a masked or loose text input for a date, with an optional calendar overlay): the root maps `label` to
 *          `accessibilityLabel`; every other prop, `value`, `onValueChange`, `inputMode`, `locale` and `isInvalid` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the eleven parts of HeroUI Native Pro, its own
 *          components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import { DateField as HeroDateField } from "heroui-native-pro/date-field";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { DateFieldProps } from "#native/date-field/date-field.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function DateFieldRoot({ label, isDisabled, ...rest }: DateFieldProps): ReactElement {
  return <HeroDateField {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface DateFieldParts {
  /** The select root wired to the date field's state. */
  readonly Select: typeof HeroDateField.Select;
  /** The portal that carries the date field's context across the overlay boundary. */
  readonly Portal: typeof HeroDateField.Portal;
  /** The backdrop behind the content. */
  readonly Overlay: typeof HeroDateField.Overlay;
  /** The popup container: a popover, a dialog or a bottom sheet. */
  readonly Content: typeof HeroDateField.Content;
  /** The calendar that commits the picked date to the field and closes the overlay. */
  readonly Calendar: typeof HeroDateField.Calendar;
  /** The pressable trigger that opens the calendar. */
  readonly Trigger: typeof HeroDateField.Trigger;
  /** The calendar icon inside the trigger. */
  readonly TriggerIndicator: typeof HeroDateField.TriggerIndicator;
  /** The group that holds the prefix, the input and the suffix. */
  readonly InputGroup: typeof HeroDateField.InputGroup;
  /** The content before the input. */
  readonly Prefix: typeof HeroDateField.Prefix;
  /** The text input that shows and edits the date. */
  readonly Input: typeof HeroDateField.Input;
  /** The content after the input, typically the trigger. */
  readonly Suffix: typeof HeroDateField.Suffix;
}

/**
 * A date field: `DateField.InputGroup` holds `DateField.Input` and, in `DateField.Suffix`, a `DateField.Trigger` that opens the `DateField.Calendar` inside `DateField.Portal`. Name it for screen readers with `label`.
 */
export const DateField: typeof DateFieldRoot & DateFieldParts = Object.assign(DateFieldRoot, {
  Select: HeroDateField.Select,
  Portal: HeroDateField.Portal,
  Overlay: HeroDateField.Overlay,
  Content: HeroDateField.Content,
  Calendar: HeroDateField.Calendar,
  Trigger: HeroDateField.Trigger,
  TriggerIndicator: HeroDateField.TriggerIndicator,
  InputGroup: HeroDateField.InputGroup,
  Prefix: HeroDateField.Prefix,
  Input: HeroDateField.Input,
  Suffix: HeroDateField.Suffix,
});
