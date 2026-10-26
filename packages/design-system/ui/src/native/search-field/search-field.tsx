/**
 * Stackra file contract:
 * Purpose: the native `SearchField` on HeroUI Native's SearchField: composes the label, the group with its search icon,
 *          input and clear button, the description and the error message from the shared field contract, so one
 *          props API reads the same as the web's. It keeps the text itself when the field is uncontrolled
 *          (`defaultValue`), maps `isReadOnly` to the input's `readOnly`, `onSubmit` to the keyboard's search key,
 *          `isLoading` to a spinner in place of the icon plus a busy state, and `clearLabel` to the clear button's name.
 * Boundary: no styling of its own beyond `w-full`. A documented adaptation: HeroUI Native's root is controlled only,
 *          so the wrapper owns the uncontrolled text; it has no form submission, so `name` is accepted for the form
 *          adapter's binding and not drawn; and it fills its parent unless the parent says otherwise, so `isFullWidth`
 *          only makes that explicit. Without a visible `label`, `accessibilityLabel` names the input, not the root.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0165 (HeroUI Native on native);
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Label, SearchField as HeroSearchField, cn } from "heroui-native";
import { useState } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Spinner } from "#native/spinner/spinner";
import type { SearchFieldProps } from "#native/search-field/search-field.props";

/**
 * A search input with a clear button. The visible `label`, `description` and `errorMessage` follow the field's states;
 * while `isLoading` a decorative spinner replaces the search icon and the input reports `busy`.
 */
export function SearchField({
  label,
  description,
  errorMessage,
  placeholder,
  variant,
  isFullWidth,
  isLoading,
  isReadOnly,
  isDisabled,
  isRequired,
  isInvalid,
  clearLabel,
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClear,
  // `name` is the form adapter's key; native has no submission, so it is taken out of what reaches the view.
  name: _name,
  accessibilityLabel,
  className,
  ...rest
}: SearchFieldProps) {
  const [ownText, setOwnText] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const text = isControlled ? value : ownText;
  const handleChange = (next: string) => {
    if (!isControlled) setOwnText(next);
    onChange?.(next);
  };

  return (
    <HeroSearchField
      {...rest}
      {...omitUndefined({ isDisabled, isRequired, isInvalid })}
      value={text}
      onChange={handleChange}
      {...omitUndefined({ className: isFullWidth ? cn("w-full", className) : className })}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroSearchField.Group>
        <HeroSearchField.SearchIcon>
          {isLoading ? <Spinner size="sm" tone="muted" /> : undefined}
        </HeroSearchField.SearchIcon>
        <HeroSearchField.Input
          {...omitUndefined({ placeholder, variant, accessibilityLabel })}
          readOnly={isReadOnly ?? false}
          onSubmitEditing={() => onSubmit?.(text)}
          // Replaces the input's own state whole, so the disabled flag is written again beside `busy`.
          {...(isLoading
            ? { accessibilityState: { busy: true, disabled: isDisabled ?? false } }
            : {})}
        />
        {isReadOnly || isDisabled ? null : (
          <HeroSearchField.ClearButton
            onPress={() => onClear?.()}
            {...(clearLabel ? { accessibilityLabel: clearLabel } : {})}
          />
        )}
      </HeroSearchField.Group>
      {description ? <Description hideOnInvalid>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroSearchField>
  );
}
