/**
 * Stackra file contract:
 * Purpose: the native `EntityPicker`, the adapted form of ADR 0318 decision 10: a labelled field that opens an inset
 *          sheet with a search field and a list of the records `loadOptions` answers. The first search starts when the
 *          sheet opens, later ones after the user pauses typing, the next page loads when the list reaches its end, and
 *          an answer a later request has replaced is dropped. One record is picked (pressing the chosen one clears it)
 *          and the sheet closes; several are toggled in the list and shown under the field as removable tags. The sheet
 *          shows a spinner while it waits and while the next page loads, `emptyMessage` when nothing matches and
 *          `loadErrorMessage` when the load fails, both announced, and a create-new row when `onCreate` and
 *          `createLabel` are given and the typed text names no listed or chosen record. Every string is drawn in
 *          `Text`.
 * Boundary: built on the native Drawer, ListItem, Avatar, TagGroup and Spinner and HeroUI Native's SearchField; no
 *           styling of its own beyond the field's width and the list's bound. The sheet sizes itself to its content,
 *           so the list is bounded to scroll inside it, keeps taps while the keyboard is up, and the search moves the
 *           sheet clear of the keyboard (HeroUI Native's sheet-aware handlers). The picker holds whole records, so a
 *           chosen record keeps its label when a later search no longer lists it. A rejected `onCreate` picks nothing;
 *           the app reports it (ADR 0139). The avatars are decorative: the label beside them names the record. `name`
 *           binds a form adapter and submits nothing on its own. "Search" and "Close" are English defaults until i18n
 *           ships.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 2 and 10); ADR 0055 (forms);
 *          ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 1.3.1, 4.1.2, 4.1.3.
 */
import {
  Description,
  FieldError,
  Input,
  Label,
  SearchField as HeroSearchField,
  TextField as HeroTextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { AccessibilityInfo, FlatList, Pressable, View } from "react-native";

import type { EntityOption } from "#contracts/types/entity-option.type";
import type { EntityPickerContractProps } from "#contracts/types/entity-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Avatar } from "#native/avatar/avatar";
import { Drawer } from "#native/drawer/drawer";
import { useEntityOptions } from "#native/entity-picker/use-entity-options";
import { Icon } from "#native/icon/icon";
import { ListItem } from "#native/list/list-item";
import { Spinner } from "#native/spinner/spinner";
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
const WORDS = { search: "Search", close: "Close" } as const;

/** The list's bound: the sheet sizes itself to its content, so a long list needs a height to scroll inside. */
const LIST_STYLE = Object.freeze({ maxHeight: 320 });

/** A message in the list: a string or number in `Text`, any other node as given, read out when it appears. */
const Message = ({ children }: { readonly children: ReactNode }) =>
  typeof children === "string" || typeof children === "number" ? (
    <Text tone="muted" className="p-3" accessibilityLiveRegion="polite">
      {children}
    </Text>
  ) : (
    <View accessibilityLiveRegion="polite">{children}</View>
  );

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

/** The sheet's search: HeroUI Native's field, wired to move the sheet clear of the keyboard. */
function SheetSearch({
  value,
  placeholder,
  onChange,
}: {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (text: string) => void;
}) {
  // Called inside the sheet's content, where the handlers reach the sheet.
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  return (
    <HeroSearchField value={value} onChange={onChange}>
      <HeroSearchField.Group>
        <HeroSearchField.SearchIcon />
        <HeroSearchField.Input
          placeholder={placeholder}
          accessibilityLabel={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </HeroSearchField.Group>
    </HeroSearchField>
  );
}

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
    isFullWidth = false,
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
  const typed = text.trim();
  const isFailed = options.status === "error";
  // Only an idle store has answered the current search; a new one keeps the old options while it loads.
  const isEmpty = options.hasAnswered && options.status === "idle" && options.options.length === 0;

  // Screen readers on iOS have no live regions, so the list's failure and empty messages are announced.
  useEffect(() => {
    const message = isFailed ? loadErrorMessage : isEmpty ? emptyMessage : undefined;
    if (isOpen && typeof message === "string") AccessibilityInfo.announceForAccessibility(message);
  }, [isOpen, isFailed, isEmpty, loadErrorMessage, emptyMessage]);

  const commit = (next: readonly EntityOption[]) => {
    if (props.value === undefined) setOwn(next);
    if (props.selectionMode === "multiple") props.onChange?.(next);
    else props.onChange?.(next[0] ?? null);
  };

  const open = () => {
    setOpen(true);
    options.search(text);
  };

  /** One press on a record: single mode picks it (or clears it when chosen) and closes; multiple mode toggles it. */
  const toggle = (option: EntityOption) => {
    const isChosen = chosen.some((record) => record.id === option.id);
    if (!isMultiple) {
      commit(isChosen ? [] : [option]);
      return setOpen(false);
    }
    commit(isChosen ? chosen.filter((record) => record.id !== option.id) : [...chosen, option]);
  };

  const create = () => {
    if (!onCreate) return;
    void Promise.resolve()
      .then(() => onCreate(typed))
      .then(
        (created) => {
          if (!created) return;
          if (!isMultiple) {
            commit([created]);
            return setOpen(false);
          }
          if (!chosen.some((record) => record.id === created.id)) commit([...chosen, created]);
        },
        // A rejection picks nothing; the app that rejected reports it (ADR 0139).
        () => undefined,
      );
  };

  const known = (candidate: EntityOption) =>
    candidate.label.toLocaleLowerCase() === typed.toLocaleLowerCase();
  const canCreate =
    onCreate !== undefined &&
    createLabel !== undefined &&
    typed !== "" &&
    !chosen.some(known) &&
    !options.options.some(known);

  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <Pressable
        // Pressable writes `disabled` over the announced state, so read-only stays enabled and does nothing.
        disabled={Boolean(isDisabled)}
        onPress={() => (isLocked ? undefined : open())}
        accessibilityRole="button"
        accessibilityLabel={name}
        accessibilityValue={{ text: chosen.map((record) => record.label).join(", ") }}
        // Read-only is not disabled: the field still shows and submits its value.
        accessibilityState={{ disabled: Boolean(isDisabled), expanded: isOpen }}
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
          <SheetSearch
            value={text}
            placeholder={WORDS.search}
            onChange={(next) => {
              setText(next);
              options.search(next);
            }}
          />
          {canCreate ? (
            <ListItem title={createLabel(typed)} startIcon="plus" onPress={create} />
          ) : null}
          {isFailed ? (
            <Message>{loadErrorMessage}</Message>
          ) : (
            <FlatList
              style={LIST_STYLE}
              data={options.options}
              keyExtractor={(option) => option.id}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              accessibilityRole="list"
              {...omitUndefined({ accessibilityLabel: name })}
              onEndReachedThreshold={0.5}
              {...(options.hasMore && options.status === "idle" && !options.isLoadingMore
                ? { onEndReached: options.loadMore }
                : {})}
              renderItem={({ item }) => {
                const isChosen = chosen.some((record) => record.id === item.id);
                return (
                  <ListItem
                    title={item.label}
                    description={item.description}
                    startIcon={avatarOf(item)}
                    isDisabled={item.isDisabled}
                    label={item.label}
                    endContent={isChosen ? <Icon name="check" tone="accent" /> : undefined}
                    onPress={() => toggle(item)}
                    accessibilityRole={isMultiple ? "checkbox" : "radio"}
                    accessibilityState={{ checked: isChosen, disabled: Boolean(item.isDisabled) }}
                  />
                );
              }}
              ListEmptyComponent={
                isEmpty && emptyMessage !== undefined ? <Message>{emptyMessage}</Message> : null
              }
              ListFooterComponent={
                options.status === "loading" || options.isLoadingMore ? (
                  <Spinner {...omitUndefined({ label: loadingLabel })} />
                ) : null
              }
            />
          )}
        </Drawer.Body>
        <Drawer.Close label={WORDS.close} />
      </Drawer>
    </HeroTextField>
  );
}
