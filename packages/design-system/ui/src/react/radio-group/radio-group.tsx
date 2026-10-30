/**
 * Stackra file contract:
 * Purpose: the web `RadioGroup` on HeroUI v3's RadioGroup and Radio (React Aria): a labelled set of radios of which
 *          one is chosen, whose value is the chosen key. Each of `options` becomes a HeroUI radio, with the group's
 *          own label, description and error message around them; every other HeroUI prop passes through.
 * Boundary: no styling of its own beyond the options' wrapper (a grid for `columns`, a wrapping row for `horizontal`),
 *           so the label, description and error never share the options' row. The group is a `radiogroup` named by its label, so a group with none takes
 *          `aria-label`. Arrow keys move and choose, as the platform's radios do. Options are data, not children, so
 *          the same list draws the same group on native.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7);
 *          ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { Description, FieldError, Label, Radio, RadioGroup as HeroRadioGroup } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { RadioGroupProps } from "#react/radio-group/radio-group.props";

/** Keeps the label above the options when the group is horizontal. */
const STACKED = "data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:gap-0";

/**
 * A set of radios of which at most one is chosen; the group reports the chosen option's `value`. `isDisabled` and
 * `isReadOnly` apply to the whole group; an option's own `isDisabled` to it alone.
 */
export function RadioGroup({
  options,
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
  orientation,
  variant,
  name,
  columns,
  className,
  ...rest
}: RadioGroupProps): ReactElement {
  const items = options.map((option) => (
    <Radio
      key={option.value}
      value={option.value}
      {...omitUndefined({ isDisabled: option.isDisabled })}
    >
      <Radio.Content>
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Label {...omitUndefined({ isDisabled: isDisabled || option.isDisabled })}>
          {option.label}
        </Label>
      </Radio.Content>
      {option.description ? <Description>{option.description}</Description> : null}
    </Radio>
  ));
  return (
    <HeroRadioGroup
      {...rest}
      // HeroUI lays a horizontal group out as one row, label included; the row is the options' alone (below).
      className={
        typeof className === "function"
          ? (state) => `${STACKED} ${className(state)}`
          : [STACKED, className].filter(Boolean).join(" ")
      }
      {...omitUndefined({
        // An empty value is "nothing chosen", which React Aria spells `null`: given "", it looks for a radio of that
        // value, finds none and leaves no radio in the tab order. No option may use "" as its own value.
        value: value === "" ? null : value,
        defaultValue: defaultValue === "" ? null : defaultValue,
        onChange,
        isRequired,
        isInvalid,
        isDisabled,
        isReadOnly,
        orientation,
        variant,
        name,
      })}
    >
      {label ? (
        <Label {...omitUndefined({ isRequired, isInvalid, isDisabled })}>{label}</Label>
      ) : null}
      {columns ? (
        <div
          data-slot="radio-group-columns"
          className="grid gap-x-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {items}
        </div>
      ) : orientation === "horizontal" ? (
        <div data-slot="radio-group-row" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {items}
        </div>
      ) : (
        items
      )}
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroRadioGroup>
  );
}
