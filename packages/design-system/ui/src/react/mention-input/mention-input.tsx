/**
 * Stackra file contract:
 * Purpose: the web `MentionInput`: a labelled multi-line box where typing `@` at the start of a word opens a list of
 *          the people whose name starts with what follows it, at the caret; choosing one (a press, Enter or Tab)
 *          writes `@Name ` in place of the query, and the ids of the people the text mentions are reported with
 *          `onMentionsChange`. Arrow keys move through the list while focus stays in the box; Escape closes it.
 * Boundary: the box is HeroUI's TextField and TextArea (React Aria's label, description and error wiring); the list is
 *           an autocompleting textbox (a textarea may not be a `combobox`: `aria-haspopup`, `aria-autocomplete`,
 *           `aria-controls`, `aria-activedescendant`) with a `listbox` of `option`s, laid out with logical properties so it mirrors in
 *           right-to-left. Names match case- and accent-insensitively in any script.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0165 (HeroUI v3 on web); ADR 0060
 *          (right-to-left); STA-1371 (wave C, owner request 2026-10-29); WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
import {
  cn,
  Description,
  FieldError,
  Label,
  TextArea as HeroTextArea,
  TextField as HeroTextField,
} from "@heroui/react";
import { useId, useLayoutEffect, useRef, useState, type ReactElement } from "react";

import type { CommentPerson } from "#contracts/types/comment-person.type";
import { INPUT_KEYS } from "#core/constants/input-keys.constant";
import { mentionQueryOf } from "#core/functions/mention-query-of.function";
import { mentionSegmentsOf } from "#core/functions/mention-segments-of.function";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Avatar } from "#react/avatar/avatar";
import { useUiText } from "#react/hooks/use-ui-text";
import type { MentionInputProps } from "#react/mention-input/mention-input.props";

/** A text box that suggests people after `@`. */
export function MentionInput({
  people,
  onMentionsChange,
  label,
  description,
  errorMessage,
  placeholder,
  rows = 3,
  maxSuggestions = 6,
  value,
  defaultValue,
  onChange,
  className,
  ...rest
}: MentionInputProps): ReactElement {
  const t = useUiText();
  const listId = useId();
  const box = useRef<HTMLTextAreaElement>(null);
  const caretAfter = useRef<number | null>(null);
  const [own, setOwn] = useState(defaultValue ?? "");
  const [caret, setCaret] = useState((defaultValue ?? "").length);
  const [active, setActive] = useState(0);
  const [isDismissed, setDismissed] = useState(false);
  const text = value ?? own;
  const query = mentionQueryOf(text.slice(0, caret));
  const matches =
    query === null
      ? []
      : people
          .filter((person) =>
            normalizeSearchText(person.name).startsWith(normalizeSearchText(query)),
          )
          .slice(0, maxSuggestions);
  const isOpen = matches.length > 0 && !isDismissed;
  const at = Math.min(active, matches.length - 1);

  useLayoutEffect(() => {
    if (caretAfter.current === null) return;
    box.current?.setSelectionRange(caretAfter.current, caretAfter.current);
    caretAfter.current = null;
  });

  const change = (next: string, nextCaret: number) => {
    if (value === undefined) setOwn(next);
    setCaret(nextCaret);
    setActive(0);
    setDismissed(false);
    onChange?.(next);
    onMentionsChange?.(mentionSegmentsOf(next, people).mentions);
  };

  const choose = (person: CommentPerson) => {
    const start = caret - (query?.length ?? 0) - 1;
    const inserted = `@${person.name} `;
    const next = text.slice(0, start) + inserted + text.slice(caret);
    caretAfter.current = start + inserted.length;
    change(next, start + inserted.length);
    box.current?.focus();
  };

  return (
    <HeroTextField
      {...omitUndefined(rest)}
      className={cn("relative", className) ?? ""}
      value={text}
      onChange={(next) => change(next, box.current?.selectionStart ?? next.length)}
    >
      {label == null ? null : <Label>{label}</Label>}
      <HeroTextArea
        ref={box}
        rows={rows}
        // A textarea may not take role="combobox" (ARIA in HTML), so it stays a textbox: aria-expanded is not a
        // textbox state, and the open list shows through aria-controls and aria-activedescendant.
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen ? `${listId}-${at}` : undefined}
        onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
        onKeyDown={(event) => {
          if (!isOpen) return;
          const chosen = matches[at];
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActive((at + step + matches.length) % matches.length);
          } else if ((event.key === "Enter" || event.key === "Tab") && chosen) {
            event.preventDefault();
            choose(chosen);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setDismissed(true);
          }
        }}
        {...omitUndefined({ placeholder })}
      />
      {isOpen ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t(INPUT_KEYS.ui.mention_input.people)}
          className="absolute inset-x-0 top-full z-50 mt-1 flex max-h-64 flex-col overflow-auto rounded-[var(--radius-control)] border border-separator bg-overlay p-1 shadow-overlay"
        >
          {matches.map((person, index) => (
            <div
              key={person.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === at}
              tabIndex={-1}
              className={cn(
                "flex min-h-10 cursor-default items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm",
                index === at && "bg-default",
              )}
              // The keyboard stays in the box (arrows, Enter); a press chooses on mouse down so the box keeps focus.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(person);
              }}
            >
              <Avatar name={person.name} src={person.avatar} size="sm" />
              <bdi className="min-w-0 truncate">{person.name}</bdi>
            </div>
          ))}
        </div>
      ) : null}
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
