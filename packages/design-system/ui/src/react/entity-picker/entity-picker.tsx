/**
 * Stackra file contract:
 * Purpose: the web `EntityPicker` on HeroUI v3's ComboBox: picks one record, or several shown as removable tags, from
 *          the pages `loadOptions` answers. The first search starts when the list opens, later ones after the user
 *          pauses typing, the next page loads when the list is scrolled to its end, and an answer a later request has
 *          replaced is dropped. The list shows a spinner while it waits, `emptyMessage` when nothing matches and
 *          `loadErrorMessage` when the load fails, and offers a create-new row when `onCreate` and `createLabel` are
 *          given. Every other HeroUI ComboBox prop passes through.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The picker holds whole records, so
 *           a chosen record keeps its label when a later search no longer lists it; in single mode the chosen record
 *           is also kept in the list, because React Aria resets the input to the text of the chosen item it finds in
 *           the list and would otherwise empty it. A form receives the records' ids (`formValue="key"`). The avatars
 *           are decorative: the label beside them names the record.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (wave 7 vocabulary); ADR 0055 (one field contract); ADR 0165
 *          (UI contract, HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2, 4.1.3.
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
  type ComboBoxRootProps,
} from "@heroui/react";
import { type ReactNode, useId, useState } from "react";
import { Text as AriaText, type Key } from "react-aria-components";

import type { EntityOption } from "#contracts/types/entity-option.type";
import type {
  EntityPickerBaseContractProps,
  EntityPickerContractProps,
} from "#contracts/types/entity-picker-contract-props.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Avatar } from "#react/avatar/avatar";
import { useEntityOptions } from "#react/entity-picker/use-entity-options";
import { Icon } from "#react/icon/icon";
import { Spinner } from "#react/spinner/spinner";
import { Text } from "#react/text/text";

/**
 * Props of the web EntityPicker: the shared contract (single or multiple, told apart by `selectionMode`) plus HeroUI
 * v3's own combo box props, passed through unchanged. The picker owns the list, the typed text and the selection, so
 * HeroUI's names for them are refused.
 */
export type EntityPickerProps = EntityPickerContractProps &
  Omit<
    ComboBoxRootProps<EntityOption>,
    | keyof EntityPickerBaseContractProps
    | keyof FieldContractProps<unknown>
    | "selectionMode"
    | "removeLabel"
    | "children"
    | "items"
    | "defaultItems"
    | "fullWidth"
    | "defaultFilter"
    | "inputValue"
    | "defaultInputValue"
    | "onInputChange"
    | "formValue"
    | "allowsCustomValue"
    | "allowsEmptyCollection"
  >;

/** The key of the create-new row: a number, which React Aria keeps as one, so it never equals a record's string id. */
const CREATE_KEY = -1;

/** The pause between the last keystroke and the search when the app sets none. */
const DEFAULT_DEBOUNCE_MS = 250;

/** Shows every item: the server has already narrowed the list to the search. */
const KEEP_ALL = () => true;

/** The value in either mode, as the list of chosen records. */
const listOf = (
  value: EntityOption | null | readonly EntityOption[] | undefined,
): readonly EntityOption[] =>
  value === undefined || value === null ? [] : "id" in value ? [value] : value;

/** The picture drawn before a record's label: its image, the initials of its name, or its icon. */
function EntityAvatar({ avatar }: { readonly avatar: NonNullable<EntityOption["avatar"]> }) {
  return (
    <Avatar
      size="sm"
      {...omitUndefined({ src: avatar.src, name: avatar.name })}
      {...(avatar.icon && !avatar.name ? { fallback: <Icon name={avatar.icon} size="sm" /> } : {})}
    />
  );
}

/** One record drawn as a list box item: its avatar, its label, an optional second line and the selected check. */
function EntityPickerOption({ option }: { readonly option: EntityOption }) {
  return (
    <ListBox.Item id={option.id} textValue={option.label} isDisabled={option.isDisabled ?? false}>
      <div className="flex min-w-0 items-center gap-2">
        {option.avatar ? <EntityAvatar avatar={option.avatar} /> : null}
        {option.description ? (
          <div className="flex min-w-0 flex-col">
            <AriaText slot="label">{option.label}</AriaText>
            <Description>{option.description}</Description>
          </div>
        ) : (
          <AriaText slot="label">{option.label}</AriaText>
        )}
      </div>
      <ListBox.ItemIndicator />
    </ListBox.Item>
  );
}

/**
 * A field that picks records found by a search the server answers: one record, or several shown as removable tags. The
 * value is the chosen record (`null` for none) or the list of them, so a label survives any later search.
 */
export function EntityPicker(props: EntityPickerProps) {
  const {
    loadOptions,
    placeholder,
    isFullWidth,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    loadingLabel,
    emptyMessage,
    loadErrorMessage,
    onCreate,
    createLabel,
    label,
    description,
    errorMessage,
    isRequired,
    isInvalid,
    isDisabled,
    isReadOnly,
    name,
    selectionMode,
    value,
    defaultValue,
    onChange,
    removeLabel,
    onOpenChange,
    ...rest
  } = props;
  const isMultiple = selectionMode === "multiple";
  const labelId = useId();
  const records = useEntityOptions(loadOptions, debounceMs);

  // The chosen records, held here only while the app leaves the field uncontrolled.
  const [own, setOwn] = useState<readonly EntityOption[]>(() => listOf(defaultValue));
  const chosen = value === undefined ? own : listOf(value);
  const single = isMultiple ? undefined : chosen[0];

  const [text, setText] = useState(single?.label ?? "");
  // The input follows the chosen record whenever it changes, from a pick or from the app: React Aria leaves a
  // controlled text alone when a controlled value changes.
  const [shownKey, setShownKey] = useState(single?.id);
  if (!isMultiple && single?.id !== shownKey) {
    setShownKey(single?.id);
    setText(single?.label ?? "");
  }

  const commit = (next: readonly EntityOption[]) => {
    if (value === undefined) setOwn(next);
    // A cast: the contract types `onChange` per mode, and `isMultiple` is that mode.
    (onChange as ((picked: EntityOption | null | readonly EntityOption[]) => void) | undefined)?.(
      isMultiple ? next : (next[0] ?? null),
    );
  };

  const create = (typed: string) => {
    if (!onCreate) return;
    // A rejection picks nothing: the app reports its own failure (ADR 0139), so it is swallowed here.
    void Promise.resolve()
      .then(() => onCreate(typed))
      .then(
        (created) => {
          if (!created) return;
          if (!isMultiple) commit([created]);
          else if (!chosen.some((option) => option.id === created.id)) commit([...chosen, created]);
        },
        () => undefined,
      );
  };

  const hasFailed = records.status === "error";
  // A failed search lists nothing it found, but the chosen record stays so React Aria keeps its label in the input.
  const found = hasFailed ? [] : records.options;
  const listed =
    single && !found.some((option) => option.id === single.id) ? [single, ...found] : found;
  const known = new Map([...chosen, ...records.options].map((option) => [option.id, option]));
  const trimmed = text.trim();
  const canCreate =
    onCreate !== undefined &&
    createLabel !== undefined &&
    trimmed !== "" &&
    trimmed.toLocaleLowerCase() !== single?.label.toLocaleLowerCase() &&
    !listed.some((option) => option.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  // Not yet answered counts as waiting: the open that shows the list is what asks.
  const isWaiting = listed.length === 0 && (records.status === "loading" || !records.hasAnswered);
  const spinner = <Spinner size="sm" tone="muted" {...omitUndefined({ label: loadingLabel })} />;

  const list = (
    <ListBox
      renderEmptyState={() =>
        isWaiting ? (
          <div className="flex justify-center p-3">{spinner}</div>
        ) : hasFailed ? null : (
          <Text tone="muted" className="p-3 text-sm">
            {emptyMessage}
          </Text>
        )
      }
    >
      {listed.map((option) => (
        <EntityPickerOption key={option.id} option={option} />
      ))}
      {canCreate ? (
        <ListBox.Item id={CREATE_KEY} textValue={createLabel(trimmed)}>
          <span className="flex items-center gap-2">
            <Icon name="plus" size="sm" />
            {createLabel(trimmed)}
          </span>
        </ListBox.Item>
      ) : null}
      {listed.length > 0 &&
      (records.hasMore || records.isLoadingMore || records.status === "loading") ? (
        <ListBoxLoadMoreItem
          isLoading={records.isLoadingMore || records.status === "loading"}
          {...(records.hasMore ? { onLoadMore: records.loadMore } : {})}
        >
          {spinner}
        </ListBoxLoadMoreItem>
      ) : null}
    </ListBox>
  );

  const tags =
    isMultiple && chosen.length > 0 ? (
      <TagGroup
        // The group is a grid, which needs a name: a string label or the caller's `aria-label` gives it as text, and
        // a node label, which has none to give, is pointed at by id.
        {...(typeof label === "string" || rest["aria-label"] || !label
          ? { "aria-label": typeof label === "string" ? label : (rest["aria-label"] ?? "") }
          : { "aria-labelledby": labelId })}
        {...(isDisabled || isReadOnly
          ? {}
          : {
              onRemove: (keys: Set<Key>) => commit(chosen.filter((option) => !keys.has(option.id))),
            })}
      >
        <TagGroup.List>
          {chosen.map((option, index) => (
            <Tag key={option.id} id={option.id} textValue={option.label}>
              {option.label}
              {isDisabled || isReadOnly ? null : (
                <>
                  {/* React Aria names the button by its own "Remove" and the tag's text; the app's words already
                      hold the record's name, so they replace both rather than repeat it. */}
                  <Tag.RemoveButton aria-labelledby={`${labelId}-remove-${index}`} />
                  <span id={`${labelId}-remove-${index}`} hidden>
                    {removeLabel?.(option.label) ?? option.label}
                  </span>
                </>
              )}
            </Tag>
          ))}
        </TagGroup.List>
      </TagGroup>
    ) : null;

  const body: ReactNode = (
    <>
      {label ? <Label id={labelId}>{label}</Label> : null}
      <HeroComboBox.InputGroup>
        <Input {...omitUndefined({ placeholder })} />
        <HeroComboBox.Trigger />
      </HeroComboBox.InputGroup>
      {/* Inside the value slot, as ComboBox does: it shields the tag grid from the combo box's own list state. */}
      {tags ? <HeroComboBox.Value>{() => tags}</HeroComboBox.Value> : null}
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <HeroComboBox.Popover>
        {/* Beside the list, not in it: a list box holds options only, and a status line is announced politely. */}
        {hasFailed && loadErrorMessage !== undefined ? (
          <Text role="status" tone="danger" className="p-3 text-sm">
            {loadErrorMessage}
          </Text>
        ) : null}
        {list}
      </HeroComboBox.Popover>
    </>
  );

  // Both modes hand React Aria the chosen ids and read picks back by id; the create-new row is never kept as chosen.
  const pickKeys = (keys: readonly Key[]) => {
    if (keys.includes(CREATE_KEY)) create(trimmed);
    commit(
      keys
        .filter((key) => key !== CREATE_KEY)
        .map((key) => known.get(String(key)))
        .filter((option): option is EntityOption => option !== undefined),
    );
  };
  // Two shapes, one element: the cast keeps TypeScript from choosing HeroUI's generic by the mode, which it cannot
  // see through a spread.
  const selection: object = isMultiple
    ? {
        selectionMode: "multiple",
        value: chosen.map((option) => option.id),
        onChange: (keys: readonly Key[]) => pickKeys(keys),
      }
    : {
        value: single?.id ?? null,
        onChange: (key: Key | null) => {
          if (key === null) commit([]);
          else if (key === CREATE_KEY) create(trimmed);
          else pickKeys([key]);
        },
      };

  return (
    <HeroComboBox
      {...rest}
      {...omitUndefined({ isRequired, isInvalid, isDisabled, isReadOnly, name })}
      {...selection}
      inputValue={text}
      onInputChange={(next: string) => {
        setText(next);
        // React Aria writes the chosen record's label back after a pick or a blur; that is not a search.
        if (next !== single?.label) records.search(next);
      }}
      onOpenChange={(isOpen: boolean, trigger?: "focus" | "input" | "manual") => {
        // Typing searches on its own, and React Aria opens the list before it reports the text, so an open by input
        // asks nothing. Opened by its button or the arrow keys, the list shows the first records.
        if (isOpen && trigger !== "input") records.search(trigger === "manual" ? "" : text);
        onOpenChange?.(isOpen, trigger);
      }}
      formValue="key"
      fullWidth={isFullWidth ?? false}
      // Before the first answer the list must open empty, or its button would do nothing: the open itself asks.
      allowsEmptyCollection={
        isWaiting || (hasFailed ? loadErrorMessage : emptyMessage) !== undefined
      }
      defaultFilter={KEEP_ALL}
    >
      {body}
    </HeroComboBox>
  );
}
