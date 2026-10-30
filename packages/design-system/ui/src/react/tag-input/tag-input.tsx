/**
 * Stackra file contract:
 * Purpose: the web `TagInput`: free-text tags in one field box: type a tag and press Enter or a comma, or paste a
 *          list split on commas and line breaks; each tag is checked (the caller's rule, duplicates, the maximum) and
 *          the last refusal is said politely under the field. Backspace in the empty input removes the last tag.
 * Boundary: the tags are the removable TagGroup (React Aria's grid: arrow keys move, Delete removes); the input is a
 *           plain text input named by the label. The state is shared with native (`useTagInputState`); the value is
 *           submitted as one hidden input per tag under `name`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 3.3.1 and 4.1.3; STA-1371.
 */
import { Description, Label, cn } from "@heroui/react";
import { useId, type ReactElement } from "react";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useTagInputState } from "#react/hooks/use-tag-input-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { TagGroup } from "#react/tag-group/tag-group";
import type { TagInputProps } from "#react/tag-input/tag-input.props";

/** The tag input's keys. */
const K = DISPLAY_KEYS.ui.tag_input;

/** Free-text tags in one field. */
export function TagInput(props: TagInputProps): ReactElement {
  const {
    label,
    description,
    errorMessage,
    placeholder,
    maxTags,
    isRequired,
    isInvalid,
    isDisabled,
    isReadOnly,
    name,
    className,
  } = props;
  const t = useUiText();
  const format = useNumberFormat();
  const id = useId();
  const { tags, draft, setDraft, problem, add, remove, isFull } = useTagInputState(props);
  const isLocked = Boolean(isDisabled || isReadOnly);
  return (
    <div data-slot="tag-input" className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        {label ? (
          <Label
            id={`${id}-label`}
            htmlFor={id}
            {...omitUndefined({ isRequired, isInvalid, isDisabled })}
          >
            {label}
          </Label>
        ) : (
          <span />
        )}
        {maxTags === undefined ? null : (
          <span className="text-xs text-muted tabular-nums">
            {t(K.count, { count: format(tags.length), max: format(maxTags) })}
          </span>
        )}
      </div>
      <div
        data-invalid={isInvalid || undefined}
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-[var(--radius-control)] border bg-field px-2 py-1.5 text-field-foreground shadow-field",
          "border-[var(--field-border)] focus-within:border-[var(--field-border-focus)] focus-within:status-focused-field",
          isInvalid && "status-invalid-field",
          isDisabled && "status-disabled",
        )}
      >
        {tags.length > 0 ? (
          <TagGroup
            {...(label ? { "aria-labelledby": `${id}-label` } : {})}
            size="sm"
            items={tags.map((tag, index) => ({ id: `${index}`, label: tag }))}
            {...(isLocked
              ? {}
              : {
                  onRemove: (keys: readonly string[]) => keys.forEach((key) => remove(Number(key))),
                  removeLabel: (tag: string) => t(K.remove, { tag }),
                })}
          />
        ) : null}
        <input
          id={id}
          dir="auto"
          value={draft}
          disabled={isDisabled}
          readOnly={isReadOnly || isFull}
          placeholder={tags.length === 0 ? placeholder : undefined}
          aria-invalid={isInvalid || undefined}
          className="min-w-24 flex-1 bg-transparent px-1 py-1 text-base outline-none placeholder:text-field-placeholder sm:text-sm"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
              remove(tags.length - 1);
            }
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            if (!/[,،;\n]/u.test(pasted)) return;
            event.preventDefault();
            add(`${draft},${pasted}`);
          }}
          onBlur={() => {
            if (draft.trim()) add(draft);
          }}
        />
      </div>
      <p aria-live="polite" className="m-0 text-xs text-danger empty:hidden">
        {problem}
      </p>
      {isInvalid && errorMessage ? (
        <p className="m-0 text-xs text-danger">{errorMessage}</p>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
      {name && !isDisabled
        ? tags.map((tag, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- allowDuplicates lets a tag repeat, so its place is its identity
            <input key={index} type="hidden" name={name} value={tag} />
          ))
        : null}
    </div>
  );
}
