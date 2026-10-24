/**
 * Stackra file contract:
 * Purpose: the native `EntityPicker`, the adapted form of ADR 0318 decision 10: a labelled field that opens an inset
 *          sheet with a search field and a list of the records `loadOptions` answers. The first search starts when the
 *          sheet opens, later ones after the user pauses typing, the next page loads when the list reaches its end, and
 *          an answer a later request has replaced is dropped. One record is picked and the sheet closes; several are
 *          toggled in the list and shown under the field as removable tags. The sheet shows a spinner while it waits,
 *          `emptyMessage` when nothing matches, `loadErrorMessage` when the load fails, and a create-new row when
 *          `onCreate` and `createLabel` are given. Every string it is handed is drawn in `Text`.
 * Boundary: built on the native Drawer, SearchField, List, Avatar and TagGroup; no styling of its own beyond the
 *           field's width. The picker holds whole records, so a chosen record keeps its label when a later search no
 *           longer lists it, and a toggle in the list leaves the chosen records the list does not show alone. A rejected
 *           `onCreate` picks nothing; the app reports it (ADR 0139). The avatars are decorative: the label beside them
 *           names the record. `name` binds a form adapter and submits nothing on its own. "Search", "Results" and
 *           "Close" are English defaults until i18n ships.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 2 and 10); ADR 0055 (forms);
 *          ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 1.3.1, 4.1.2, 4.1.3.
 */
import { Description, FieldError, Input, Label, TextField as HeroTextField } from "heroui-native";
import { useState, type ReactElement, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import type { EntityOption } from "#contracts/types/entity-option.type";
import type { EntityPickerContractProps } from "#contracts/types/entity-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Avatar } from "#native/avatar/avatar";
import { Drawer } from "#native/drawer/drawer";
import { useEntityOptions } from "#native/entity-picker/use-entity-options";
import { Icon } from "#native/icon/icon";
import { ListItem } from "#native/list/list-item";
import { List } from "#native/list/list";
import { SearchField } from "#native/search-field/search-field";
import { TagGroup } from "#native/tag-group/tag-group";
import { Text } from "#native/text/text";

/** Props of the native EntityPicker: the shared contract in its single or multiple form. */
export type EntityPickerProps = EntityPickerContractProps & {
  /** The field's accessible name when the label is not a string. */
  readonly accessibilityLabel?: string | undefined;
  /** Styles the root, as on web. */
  readonly className?: string | undefined;
};

// shortcut: English words until @stackra/i18n ships; then the keys `ui::entity-picker.*`.
const WORDS = { search: "Search", results: "Results", close: "Close" } as const;

/** A string or number in `Text`; any other node as given. */
const inText = (node: ReactNode): ReactNode =>
  typeof node === "string" || typeof node === "number" ? <Text>{node}</Text> : node;

/** The decorative picture of a record: its image, its initials, or its icon. */
const avatarOf = (option: EntityOption): ReactElement | undefined =>
  option.avatar === undefined ? undefined : (
    <Avatar
      size="sm"
      {...omitUndefined({ src: option.avatar.src, name: option.avatar.name })}
      {...(option.avatar.icon === undefined
        ? {}
        : { fallback: <Icon name={option.avatar.icon} /> })}
    />
  );

/**
 * A field that picks one record, or several, from a searched list. Pair `value` with `onChange` to control it, or give
 * `defaultValue`; `onChange` receives the record (or `null`), or the list of records in multiple mode.
 */
export function EntityPicker(props: EntityPickerProps): ReactElement {
  const {
    label,
    description,
    errorMessage,
    placeholder,
    isFullWidth = true,
    isRequired,
    isInvalid,
    isDisabled,
    isReadOnly,
    loadOptions,
    debounceMs = 250,
    loadingLabel,
    emptyMessage,
    loadErrorMessage,
    onCreate,
    createLabel,
    className,
    accessibilityLabel,
  } = props;
  const isMultiple = props.selectionMode === "multiple";
  const [own, setOwn] = useState<readonly EntityOption[]>(() =>
    props.selectionMode === "multiple"
      ? (props.defaultValue ?? [])
      : props.defaultValue
        ? [props.defaultValue]
        : [],
  );
  const [isOpen, setOpen] = useState(false);
  const [text, setText] = useState("");
  const options = useEntityOptions(loadOptions, debounceMs);
  const chosen: readonly EntityOption[] =
    props.value === undefined
      ? own
      : props.selectionMode === "multiple"
        ? props.value
        : props.value
          ? [props.value]
          : [];
  const name = accessibilityLabel ?? (typeof label === "string" ? label : undefined);
  const isLocked = Boolean(isDisabled || isReadOnly);

  const commit = (next: readonly EntityOption[]) => {
    if (props.value === undefined) setOwn(next);
    if (props.selectionMode === "multiple") props.onChange?.(next);
    else props.onChange?.(next[0] ?? null);
  };

  const open = () => {
    setOpen(true);
    options.search(text);
  };

  const pick = (option: EntityOption) => {
    if (!isMultiple) {
      commit([option]);
      return setOpen(false);
    }
    commit([...chosen.filter((record) => record.id !== option.id), option]);
  };

  const select = (keys: readonly string[]) => {
    const listed = new Map(options.options.map((option) => [option.id, option]));
    if (!isMultiple) {
      const option = keys[0] === undefined ? undefined : listed.get(keys[0]);
      if (option) commit([option]);
      return setOpen(false);
    }
    // The list reports only the records it shows; the chosen ones it does not show stay chosen.
    const kept = chosen.filter((record) => !listed.has(record.id) || keys.includes(record.id));
    const keptIds = new Set(kept.map((record) => record.id));
    const added = keys.flatMap((id) => {
      const option = listed.get(id);
      return option && !keptIds.has(id) ? [option] : [];
    });
    commit([...kept, ...added]);
  };

  const create = () => {
    const typed = text.trim();
    void Promise.resolve()
      .then(() => onCreate?.(typed))
      .then(
        (created) => {
          if (created) pick(created);
        },
        // A rejection picks nothing; the app that rejected reports it (ADR 0139).
        () => undefined,
      );
  };

  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <Pressable
        disabled={isLocked}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={name}
        accessibilityValue={{ text: chosen.map((record) => record.label).join(", ") }}
        accessibilityState={{ disabled: isLocked, expanded: isOpen }}
      >
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
          <Input
            value={isMultiple ? "" : (chosen[0]?.label ?? "")}
            {...omitUndefined({ placeholder })}
            editable={false}
          />
        </View>
      </Pressable>
      {isMultiple && chosen.length > 0 ? (
        <TagGroup
          {...omitUndefined({ accessibilityLabel: name, isDisabled, isReadOnly })}
          items={chosen.map((record) => ({ id: record.id, label: record.label }))}
          onRemove={(keys) => commit(chosen.filter((record) => !keys.includes(record.id)))}
          removeLabel={props.removeLabel}
        />
      ) : null}
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <Drawer isOpen={isOpen && !isLocked} onOpenChange={setOpen} label={name}>
        <Drawer.Header>
          <Drawer.Title>{label ?? name}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <SearchField
            accessibilityLabel={WORDS.search}
            {...omitUndefined({ placeholder })}
            value={text}
            onChange={(next) => {
              setText(next);
              options.search(next);
            }}
          />
          {onCreate && createLabel && text.trim() !== "" ? (
            <ListItem title={createLabel(text.trim())} startIcon="plus" onPress={create} />
          ) : null}
          {options.status === "error" ? (
            inText(loadErrorMessage)
          ) : (
            <List
              label={name ?? WORDS.results}
              items={options.options.map((option) => ({
                id: option.id,
                title: option.label,
                description: option.description,
                startIcon: avatarOf(option),
                isDisabled: option.isDisabled,
                label: option.label,
              }))}
              selectionMode={isMultiple ? "multiple" : "single"}
              selectedKeys={chosen.map((record) => record.id)}
              onSelectionChange={select}
              isLoading={options.status === "loading"}
              {...omitUndefined({ loadingLabel })}
              emptyState={options.hasAnswered ? inText(emptyMessage) : null}
              hasMore={options.hasMore}
              onLoadMore={options.loadMore}
            />
          )}
        </Drawer.Body>
        <Drawer.Close label={WORDS.close} />
      </Drawer>
    </HeroTextField>
  );
}
