/**
 * Stackra file contract:
 * Purpose: the native `MultiSelect`: a field that shows the chosen options as chips inside it and opens a sheet with a
 *          search and the options as checkable rows. The search narrows them by label (any case, any accent, the
 *          provider's locale); a press toggles an option with a selection haptic. A chip's press removes it, with the
 *          same haptic. Chips pop in and out, and the others slide into place (Reanimated layout animations).
 * Boundary: the look is HeroUI Native's field and the house Chip, Drawer and ListItem. The options are known up front;
 *           a list a server searches is EntityPicker's. Motion follows the system's reduced-motion setting. "Remove
 *           {label}", "Search", "Done" and the empty words come from the `ui` catalogue.
 * Runtime: react-native
 * Governing contract: gap inventory row 4 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0055
 *          (forms: one field contract); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 1.3.1, 4.1.2.
 */
import {
  Description,
  FieldError,
  Label,
  SearchField as HeroSearchField,
  TextField as HeroTextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import Animated, { LinearTransition, ReduceMotion, ZoomIn, ZoomOut } from "react-native-reanimated";
import type { ReactElement } from "react";

import { FIELD_RADIUS_CLASS_NAME } from "#core/constants/field-radius-class-name.constant";
import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Chip } from "#native/chip/chip";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { haptics } from "#native/haptics/haptics";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Icon } from "#native/icon/icon";
import { ListItem } from "#native/list/list-item";
import type { MultiSelectProps } from "#native/multi-select/multi-select.props";
import { Text } from "#native/text/text";

/** The list's bound: the sheet sizes itself to its content, so a long list needs a height to scroll inside. */
const LIST_STYLE = Object.freeze({ maxHeight: 320 });

const POP_IN = ZoomIn.springify().reduceMotion(ReduceMotion.System);
const POP_OUT = ZoomOut.duration(motionTiming(STACKRA_THEME, "fast").durationMs).reduceMotion(
  ReduceMotion.System,
);
const SETTLE = LinearTransition.springify().reduceMotion(ReduceMotion.System);

/** The sheet's search, wired to move the sheet clear of the keyboard; called inside the sheet's content. */
function SheetSearch(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (text: string) => void;
}) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  return (
    <HeroSearchField value={props.value} onChange={props.onChange}>
      <HeroSearchField.Group>
        <HeroSearchField.SearchIcon />
        <HeroSearchField.Input
          placeholder={props.placeholder}
          accessibilityLabel={props.placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </HeroSearchField.Group>
    </HeroSearchField>
  );
}

/** The extras' keys. */
const MORE_K = DISPLAY_KEYS.ui.multi_select_more;

/** A field that picks several options from a searchable sheet and shows them as removable chips. */
export function MultiSelect({
  items,
  placeholder,
  isFullWidth = true,
  removeLabel,
  emptyMessage,
  label,
  description,
  errorMessage,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  name: _name,
  className,
  accessibilityLabel,
  hasSelectAll = false,
  maxVisible,
}: MultiSelectProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const { locale } = useDesignSystem();
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const chosen = value ?? own;
  const [isOpen, setOpen] = useState(false);
  const [text, setText] = useState("");
  const isLocked = Boolean(isDisabled || isReadOnly);
  const fieldName = accessibilityLabel ?? (typeof label === "string" ? label : undefined);
  const byId = new Map(items.map((item) => [item.id, item]));
  const collator = new Intl.Collator(locale, { sensitivity: "base", usage: "search" });
  const query = text.trim();
  // A "contains" match with the collator, so "cafe" finds "Café" and case never matters.
  const matches = (optionLabel: string) =>
    query === "" ||
    Array.from({ length: optionLabel.length - query.length + 1 }, (_, at) =>
      optionLabel.slice(at, at + query.length),
    ).some((part) => collator.compare(part, query) === 0);
  const shown = items.filter((item) => matches(item.label));

  const commit = (next: readonly string[]) => {
    haptics.play("selection");
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const visible = maxVisible === undefined ? chosen : chosen.slice(0, maxVisible);
  const hidden = chosen.slice(visible.length);
  const choosable = items.filter((item) => !item.isDisabled).map((item) => item.id);
  const isAll = choosable.length > 0 && choosable.every((id) => chosen.includes(id));
  const toggle = (id: string) =>
    commit(chosen.includes(id) ? chosen.filter((key) => key !== id) : [...chosen, id]);

  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <Pressable
        disabled={Boolean(isDisabled)}
        onPress={() => (isLocked ? undefined : setOpen(true))}
        accessibilityRole="button"
        accessibilityLabel={fieldName}
        accessibilityValue={{
          text: chosen.map((id) => byId.get(id)?.label ?? id).join(", "),
        }}
        accessibilityState={{ disabled: Boolean(isDisabled), expanded: isOpen }}
        // The field's own colours and radius tokens, so the chip box reads as HeroUI Native's input.
        className={`min-h-12 flex-row flex-wrap items-center gap-2 border border-field-border bg-field px-3 py-2 ${FIELD_RADIUS_CLASS_NAME}`}
      >
        {chosen.length === 0 ? (
          <Text tone="muted">{placeholder}</Text>
        ) : (
          visible.map((id) => {
            const chipLabel = byId.get(id)?.label ?? id;
            return (
              <Animated.View key={id} entering={POP_IN} exiting={POP_OUT} layout={SETTLE}>
                <Pressable
                  disabled={isLocked}
                  onPress={() => commit(chosen.filter((key) => key !== id))}
                  accessibilityRole="button"
                  accessibilityLabel={
                    removeLabel?.(chipLabel) ??
                    t(UI_KEYS.ui.multi_select.remove, { label: chipLabel })
                  }
                >
                  <Chip size="sm" {...(isLocked ? {} : { endIcon: "x" as const })}>
                    {chipLabel}
                  </Chip>
                </Pressable>
              </Animated.View>
            );
          })
        )}
        {hidden.length > 0 ? (
          <View
            accessible
            accessibilityLabel={t(MORE_K.more_label, {
              count: format(hidden.length),
              labels: hidden.map((id) => byId.get(id)?.label ?? id).join(", "),
            })}
          >
            <Chip size="sm">{t(MORE_K.more, { count: format(hidden.length) })}</Chip>
          </View>
        ) : null}
        <View className="ms-auto">
          <Icon name="chevron-down" tone="muted" />
        </View>
      </Pressable>
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <Drawer isOpen={isOpen && !isLocked} onOpenChange={setOpen} label={fieldName}>
        <Drawer.Header>
          <Drawer.Title>{label ?? fieldName}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <SheetSearch
            value={text}
            placeholder={t(UI_KEYS.ui.multi_select.search)}
            onChange={setText}
          />
          {hasSelectAll && choosable.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => commit(isAll ? [] : choosable)}
              className="min-h-11 justify-center px-3"
            >
              <Text className="font-medium text-accent-soft-foreground">
                {t(isAll ? MORE_K.clear_all : MORE_K.select_all)}
              </Text>
            </Pressable>
          ) : null}
          <FlatList
            style={LIST_STYLE}
            data={shown}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            accessibilityRole="list"
            {...omitUndefined({ accessibilityLabel: fieldName })}
            renderItem={({ item }) => {
              const isChosen = chosen.includes(item.id);
              return (
                <ListItem
                  title={item.label}
                  description={item.description}
                  isDisabled={item.isDisabled}
                  label={item.label}
                  endContent={isChosen ? <Icon name="check" tone="accent" /> : undefined}
                  onPress={() => toggle(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChosen, disabled: Boolean(item.isDisabled) }}
                />
              );
            }}
            ListEmptyComponent={
              <Text tone="muted" className="p-3" accessibilityLiveRegion="polite">
                {emptyMessage ?? t(UI_KEYS.ui.multi_select.no_matches)}
              </Text>
            }
          />
        </Drawer.Body>
        <Drawer.Close label={t(UI_KEYS.ui.multi_select.close)} />
      </Drawer>
    </HeroTextField>
  );
}
