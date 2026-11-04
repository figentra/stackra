/**
 * Stackra file contract:
 * Purpose: the web `Autocomplete` on HeroUI v3's Autocomplete: a select whose list opens with a search box that
 *          narrows it. It draws the single ComboBox contract (`items`, the field props, the typed text,
 *          `isServerFiltered`, `isLoading`, `onLoadMore` and `emptyMessage`) as HeroUI's label, trigger with its clear
 *          button, popover, search field and list box, maps the key in and out as a string, and passes every other
 *          HeroUI Autocomplete prop through.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. Unlike ComboBox, the trigger is a
 *           button and the text is typed in the open list, so a short list stays a select and a long one is searched.
 *           The list filters on the typed text with React Aria's locale-aware "contains" unless the app filters
 *           (`isServerFiltered`). React Aria's Select has no read-only state, so `isReadOnly` keeps the list shut and
 *           drops the clear button, while the value is still submitted. The search box's and the clear button's names
 *           come from `labels`, else from the package's own words, which replace HeroUI's English default.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (one field contract);
 *          owner decision 6 of STA-350 (thin wrappers); WAI-ARIA select and listbox patterns; STA-1981.
 */
import {
  Autocomplete as HeroAutocomplete,
  Description,
  FieldError,
  Label,
  ListBox,
  ListBoxLoadMoreItem,
  SearchField,
} from "@heroui/react";
import type { ReactElement } from "react";
import { Text as AriaText, type Key, useFilter } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { AutocompleteProps } from "#react/autocomplete/autocomplete.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Spinner } from "#react/spinner/spinner";
import { Text } from "#react/text/text";

/** Shows every item: the filter of a list the app has already narrowed. */
const KEEP_ALL = () => true;

/** A select whose list is narrowed by a search box: one key, `null` for none. */
export function Autocomplete({
  items,
  label,
  description,
  errorMessage,
  placeholder,
  isFullWidth,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  inputValue,
  onInputChange,
  isServerFiltered,
  isLoading,
  loadingLabel,
  onLoadMore,
  emptyMessage,
  value,
  defaultValue,
  onChange,
  name,
  labels,
  ...rest
}: AutocompleteProps): ReactElement {
  const t = useUiText();
  const { contains } = useFilter({ sensitivity: "base" });
  const search = labels?.search ?? t(UI_KEYS.ui.multi_select.search);
  return (
    <HeroAutocomplete
      {...rest}
      {...omitUndefined({
        placeholder,
        isRequired,
        isInvalid,
        isDisabled,
        name,
        value,
        defaultValue,
      })}
      {...(isReadOnly ? { isOpen: false } : {})}
      onChange={(key: Key | null) => onChange?.(key === null ? null : String(key))}
      fullWidth={isFullWidth ?? false}
      allowsEmptyCollection={emptyMessage !== undefined}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroAutocomplete.Trigger>
        <HeroAutocomplete.Value />
        {isReadOnly ? null : (
          <HeroAutocomplete.ClearButton
            aria-label={labels?.clear ?? t(UI_KEYS.ui.bulk_action_bar.clear)}
          />
        )}
        <HeroAutocomplete.Indicator />
      </HeroAutocomplete.Trigger>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <HeroAutocomplete.Popover>
        <HeroAutocomplete.Filter
          filter={isServerFiltered ? KEEP_ALL : contains}
          {...omitUndefined({ inputValue, onInputChange })}
        >
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- reason: the search box mounts only when the user opens the list, and typing is what opening it is for */}
          <SearchField autoFocus aria-label={search} variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={search} />
              <SearchField.ClearButton aria-label={t(UI_KEYS.ui.search_field.clear)} />
            </SearchField.Group>
          </SearchField>
          <ListBox
            renderEmptyState={() => (
              <Text tone="muted" className="p-3 text-sm">
                {emptyMessage}
              </Text>
            )}
          >
            {items.map((item) => (
              <ListBox.Item
                key={item.id}
                id={item.id}
                textValue={item.label}
                isDisabled={item.isDisabled ?? false}
              >
                {item.description ? (
                  <div className="flex flex-col">
                    <AriaText slot="label">{item.label}</AriaText>
                    <Description>{item.description}</Description>
                  </div>
                ) : (
                  item.label
                )}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
            {onLoadMore || isLoading ? (
              <ListBoxLoadMoreItem {...omitUndefined({ onLoadMore, isLoading })}>
                <Spinner size="sm" tone="muted" {...omitUndefined({ label: loadingLabel })} />
              </ListBoxLoadMoreItem>
            ) : null}
          </ListBox>
        </HeroAutocomplete.Filter>
      </HeroAutocomplete.Popover>
    </HeroAutocomplete>
  );
}
