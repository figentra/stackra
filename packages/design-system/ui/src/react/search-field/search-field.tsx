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
import {
  Description,
  FieldError,
  Label,
  SearchField as HeroSearchField,
  type SearchFieldRootProps,
} from "@heroui/react";

import type { SearchFieldContractProps } from "#contracts/types/search-field-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Spinner } from "#react/spinner/spinner";

/**
 * Props of the web SearchField: the shared contract plus HeroUI v3's own search field props, passed through
 * unchanged. HeroUI's `fullWidth` is the contract's `isFullWidth`, its `placeholder` belongs to the input, and its
 * children are composed here.
 */
export type SearchFieldProps = SearchFieldContractProps &
  Omit<SearchFieldRootProps, keyof SearchFieldContractProps | "fullWidth" | "children">;

// shortcut: an English default until @stackra/i18n ships; then the key `ui::search-field.clear`.
const CLEAR_LABEL = "Clear search";

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
  clearLabel = CLEAR_LABEL,
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
        <HeroSearchField.ClearButton aria-label={clearLabel} />
      </HeroSearchField.Group>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroSearchField>
  );
}
