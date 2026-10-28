/**
 * Stackra file contract:
 * Purpose: the web `ComboBox` on HeroUI v3's ComboBox: draws the shared contract (`items`, the field props, the typed
 *          text, `isServerFiltered`, `isLoading`, `onLoadMore` and `emptyMessage`) as HeroUI's label, input group,
 *          popover and list box, maps keys in and out as strings, and passes every other HeroUI ComboBox prop through
 *          (`allowsCustomValue` and `menuTrigger` among them, which native does not have). In multiple mode the picked
 *          choices show as removable HeroUI tags under the input.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The list filters on the typed
 *          text with React Aria's locale-aware "contains" unless the app filters (`isServerFiltered`). A field without a
 *          `label` names itself with `aria-label`, which passes through. The remove buttons take React Aria's own
 *          localised name, which the HeroUI default would replace with an English one.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (one field contract);
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import {
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxLoadMoreItem,
  Tag,
  TagGroup,
  ComboBox as HeroComboBox,
} from "@heroui/react";
import { type ReactNode, useId, type ReactElement } from "react";
import { Text as AriaText, type Key } from "react-aria-components";

import type { SelectItem } from "#contracts/types/select-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Spinner } from "#react/spinner/spinner";
import { Text } from "#react/text/text";
import type { ComboBoxProps } from "#react/combo-box/combo-box.props";

/** Props for a remove button that leave its accessible name to React Aria, which words it in the user's language. */
// A cast: HeroUI types `aria-label` as a string, but its default name is English and `undefined` does not override a
// context value, so it is the one way to let React Aria's own localised name through.
const REACT_ARIA_NAME = { "aria-label": undefined } as unknown as { "aria-label": string };

/** Shows every item: the filter of a list the app has already narrowed. */
const KEEP_ALL = () => true;

/** One choice drawn as a list box item: its label, an optional description under it and the selected check. */
function ComboBoxOption({ item }: { readonly item: SelectItem }) {
  return (
    <ListBox.Item id={item.id} textValue={item.label} isDisabled={item.isDisabled ?? false}>
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
  );
}

/**
 * A field that picks from a list narrowed by the text typed into it: one key, or several in multiple mode. The value is
 * the chosen key (`null` for nothing) or the list of keys; `onChange` is called with strings.
 */
export function ComboBox({
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
  selectionMode,
  value,
  defaultValue,
  onChange,
  name,
  ...rest
}: ComboBoxProps): ReactElement {
  const labelId = useId();
  const labelOf = (key: unknown) => items.find((item) => item.id === String(key))?.label ?? "";
  const list = (
    <ListBox
      renderEmptyState={() => (
        <Text tone="muted" className="p-3 text-sm">
          {emptyMessage}
        </Text>
      )}
    >
      {items.map((item) => (
        <ComboBoxOption key={item.id} item={item} />
      ))}
      {onLoadMore || isLoading ? (
        <ListBoxLoadMoreItem {...omitUndefined({ onLoadMore, isLoading })}>
          <Spinner size="sm" tone="muted" {...omitUndefined({ label: loadingLabel })} />
        </ListBoxLoadMoreItem>
      ) : null}
    </ListBox>
  );
  const body: ReactNode = (
    <>
      {label ? <Label id={labelId}>{label}</Label> : null}
      <HeroComboBox.InputGroup>
        <Input {...omitUndefined({ placeholder })} />
        <HeroComboBox.Trigger />
      </HeroComboBox.InputGroup>
      {selectionMode === "multiple" ? (
        <HeroComboBox.Value>
          {({ state }) =>
            state.selectionManager.selectedKeys.size === 0 ? null : (
              <TagGroup
                // The group is a grid, which needs a name: a string label or the caller's `aria-label` gives it as
                // text, and a node label, which has none to give, is pointed at by id.
                {...(typeof label === "string" || rest["aria-label"] || !label
                  ? { "aria-label": typeof label === "string" ? label : (rest["aria-label"] ?? "") }
                  : { "aria-labelledby": labelId })}
                {...(isDisabled || isReadOnly
                  ? {}
                  : {
                      onRemove: (keys: Set<Key>) => {
                        for (const key of keys) state.selectionManager.toggleSelection(key);
                      },
                    })}
              >
                <TagGroup.List>
                  {[...state.selectionManager.selectedKeys].map((key) => (
                    <Tag key={key} id={key} textValue={labelOf(key)}>
                      {labelOf(key)}
                      <Tag.RemoveButton {...REACT_ARIA_NAME} />
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            )
          }
        </HeroComboBox.Value>
      ) : null}
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <HeroComboBox.Popover>{list}</HeroComboBox.Popover>
    </>
  );
  // Two shapes, one element: `selectionMode` tells the key and the list of keys apart, and the cast keeps TypeScript
  // from choosing HeroUI's generic by the mode, which it cannot see through a spread.
  const selection: object =
    selectionMode === "multiple"
      ? omitUndefined({
          selectionMode,
          value,
          defaultValue,
          onChange: (keys: readonly Key[]) => onChange?.(keys.map(String)),
        })
      : omitUndefined({
          value,
          defaultValue,
          onChange: (key: Key | null) => onChange?.(key === null ? null : String(key)),
        });
  return (
    <HeroComboBox
      {...rest}
      {...omitUndefined({
        isRequired,
        isInvalid,
        isDisabled,
        isReadOnly,
        inputValue,
        onInputChange,
        name,
      })}
      {...selection}
      fullWidth={isFullWidth ?? false}
      allowsEmptyCollection={emptyMessage !== undefined}
      {...(isServerFiltered ? { defaultFilter: KEEP_ALL } : {})}
    >
      {body}
    </HeroComboBox>
  );
}
