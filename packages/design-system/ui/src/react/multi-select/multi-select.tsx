/**
 * Stackra file contract:
 * Purpose: the web `MultiSelect` on HeroUI v3's ComboBox in multiple mode: the typed text narrows the options by label
 *          (any case, any accent, in the active locale), a pick adds it as a removable chip inside the field and clears
 *          the text, and a chip leaves by its remove button or Backspace/Delete. A chip pops in when it is added.
 * Boundary: no styling of its own; the look is HeroUI's ComboBox, ListBox and TagGroup. The options are known up front;
 *           a list a server searches is EntityPicker's. A form receives the chosen ids. The pop is skipped under
 *           prefers-reduced-motion. shortcut: a removed chip leaves at once, because React Aria drops it from its
 *           collection before an exit could play; animate the exit if React Aria ever keeps leaving items.
 * Runtime: browser
 * Governing contract: gap inventory row 4 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0055
 *          (forms: one field contract); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 4.1.2.
 */
import type { ReactElement } from "react";
import {
  ComboBox as HeroComboBox,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  Tag,
  TagGroup,
} from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion } from "motion/react";
import { useId, useRef, useState } from "react";
import { type Key, useFilter } from "react-aria-components";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useUiText } from "#react/hooks/use-ui-text";
import type { MultiSelectProps } from "#react/multi-select/multi-select.props";
import { Text } from "#react/text/text";

const FAST = motionTiming(STACKRA_THEME, "fast");

/** The overflow chip's id, kept out of the value. */
const MORE = "__more";

/** The extras' keys. */
const MORE_K = DISPLAY_KEYS.ui.multi_select_more;

/** A field that picks several options, filtered as the user types and shown as removable chips. */
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
  name,
  value,
  defaultValue,
  onChange,
  hasSelectAll = false,
  maxVisible,
  ...rest
}: MultiSelectProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const labelId = useId();
  const input = useRef<HTMLInputElement>(null);
  const isReduced = useReducedMotion() ?? false;
  const { contains } = useFilter({ sensitivity: "base" });
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const chosen = value ?? own;
  const [text, setText] = useState("");
  const byId = new Map(items.map((item) => [item.id, item]));
  const isLocked = Boolean(isDisabled || isReadOnly);

  const shown = maxVisible === undefined ? chosen : chosen.slice(0, maxVisible);
  const hidden = chosen.slice(shown.length);
  const choosable = items.filter((item) => !item.isDisabled).map((item) => item.id);
  const isAll = choosable.length > 0 && choosable.every((id) => chosen.includes(id));
  const commit = (next: readonly string[]) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };

  const chips =
    chosen.length > 0 ? (
      <TagGroup
        // The group is a grid, which needs a name: the string label, the caller's, or the node label by id.
        {...(typeof label === "string" || rest["aria-label"] || !label
          ? { "aria-label": typeof label === "string" ? label : (rest["aria-label"] ?? "") }
          : { "aria-labelledby": labelId })}
        {...(isLocked
          ? {}
          : {
              onRemove: (keys: Set<Key>) => {
                const next = chosen.filter((id) => !keys.has(id));
                commit(next);
                // The last chip takes the grid with it, so focus goes back to the input, not the page.
                if (next.length === 0) requestAnimationFrame(() => input.current?.focus());
              },
            })}
      >
        <TagGroup.List>
          {shown.map((id, index) => {
            const chipLabel = byId.get(id)?.label ?? id;
            return (
              <Tag key={id} id={id} textValue={chipLabel}>
                <motion.span
                  className="inline-flex"
                  initial={isReduced ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    duration: (FAST.durationMs * 2) / 1000,
                    bounce: 0.35,
                  }}
                >
                  {chipLabel}
                </motion.span>
                {isLocked ? null : (
                  <Tag.RemoveButton
                    id={`${labelId}-remove-${index}`}
                    aria-label={
                      removeLabel?.(chipLabel) ??
                      t(UI_KEYS.ui.multi_select.remove, { label: chipLabel })
                    }
                    aria-labelledby={`${labelId}-remove-${index}`}
                  />
                )}
              </Tag>
            );
          })}
          {hidden.length > 0 ? (
            // The overflow chip names what it hides, and has no remove button: open the list to change those.
            <Tag
              id={MORE}
              textValue={t(MORE_K.more_label, {
                count: format(hidden.length),
                labels: hidden.map((id) => byId.get(id)?.label ?? id).join(", "),
              })}
            >
              {t(MORE_K.more, { count: format(hidden.length) })}
            </Tag>
          ) : null}
        </TagGroup.List>
      </TagGroup>
    ) : null;

  return (
    <HeroComboBox
      {...rest}
      {...omitUndefined({ isRequired, isInvalid, isDisabled, isReadOnly, name })}
      selectionMode="multiple"
      value={[...chosen]}
      onChange={(keys: readonly Key[]) => {
        commit(keys.map(String));
        setText("");
      }}
      inputValue={text}
      onInputChange={setText}
      defaultFilter={contains}
      allowsEmptyCollection
      formValue="key"
      fullWidth={isFullWidth}
    >
      {label ? <Label id={labelId}>{label}</Label> : null}
      <HeroComboBox.InputGroup>
        <Input ref={input} {...omitUndefined({ placeholder })} />
        <HeroComboBox.Trigger />
      </HeroComboBox.InputGroup>
      {/* Inside the value slot, as EntityPicker does: it shields the chip grid from the combo box's list state. */}
      {chips ? <HeroComboBox.Value>{() => chips}</HeroComboBox.Value> : null}
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <HeroComboBox.Popover>
        {hasSelectAll && choosable.length > 0 ? (
          <button
            type="button"
            onClick={() => commit(isAll ? [] : choosable)}
            className="m-1 min-h-8 rounded-[var(--radius-control)] px-2 text-start text-sm font-medium text-accent-soft-foreground outline-none hover:bg-default focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus"
          >
            {t(isAll ? MORE_K.clear_all : MORE_K.select_all)}
          </button>
        ) : null}
        <ListBox
          items={items}
          renderEmptyState={() => (
            <Text tone="muted" className="p-3 text-sm">
              {emptyMessage ?? t(UI_KEYS.ui.multi_select.no_matches)}
            </Text>
          )}
        >
          {(item) => (
            <ListBox.Item id={item.id} textValue={item.label} isDisabled={item.isDisabled ?? false}>
              {item.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </HeroComboBox.Popover>
    </HeroComboBox>
  );
}
