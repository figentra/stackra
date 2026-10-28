/**
 * Stackra file contract:
 * Purpose: the web `SearchField` on HeroUI v3's SearchField: composes the label, the group with its search icon, input
 *          and clear button, the description and the error message from the shared field contract (`isFullWidth` to
 *          `fullWidth`, `isLoading` to a spinner in place of the icon and `aria-busy` on the input, `clearLabel` to the clear
 *          button's name) and passes every other HeroUI and React Aria prop through unchanged.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. HeroUI draws its own search
 *          glyph, so the icon is not an `IconName` slot. Without a visible `label` the caller names the field with
 *          `aria-label`. HeroUI's close button hardcodes the name "Close", so the clear button always gets an explicit
 *          name here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0165 (HeroUI v3 on web); owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Label, SearchField as HeroSearchField } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Spinner } from "#react/spinner/spinner";
import type { SearchFieldProps } from "#react/search-field/search-field.props";

/**
 * A search input with a clear button. The visible `label`, `description` and `errorMessage` are tied to the input for
 * screen readers; while `isLoading` a decorative spinner replaces the search icon and the input is marked busy.
 */
export function SearchField({
  label,
  description,
  errorMessage,
  placeholder,
  variant,
  isFullWidth,
  isLoading,
  clearLabel: clearLabelProp,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClear,
  name,
  ...rest
}: SearchFieldProps) {
  const t = useUiText();
  const clearLabel = clearLabelProp ?? t(UI_KEYS.ui.search_field.clear);
  return (
    <HeroSearchField
      {...rest}
      {...omitUndefined({
        variant,
        fullWidth: isFullWidth,
        isRequired,
        isInvalid,
        isDisabled,
        isReadOnly,
        value,
        defaultValue,
        onChange,
        onSubmit,
        onClear,
        name,
      })}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroSearchField.Group>
        {isLoading ? (
          <HeroSearchField.SearchIcon>
            <Spinner size="sm" tone="muted" />
          </HeroSearchField.SearchIcon>
        ) : (
          <HeroSearchField.SearchIcon />
        )}
        <HeroSearchField.Input
          {...omitUndefined({ placeholder })}
          // On the input: React Aria's root forwards no `aria-*`, and the input is what a screen reader is on.
          {...(isLoading ? { "aria-busy": true } : {})}
        />
        {/* `size-6`: HeroUI's `size-5` is 20px, under the 24px minimum target of WCAG 2.2 SC 2.5.8. */}
        <HeroSearchField.ClearButton aria-label={clearLabel} className="size-6" />
      </HeroSearchField.Group>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroSearchField>
  );
}
