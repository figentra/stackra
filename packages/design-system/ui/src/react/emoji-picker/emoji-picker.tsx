/**
 * Stackra file contract:
 * Purpose: the web `EmojiPicker`: a search box over a scrolling grid of emoji under category headings (recent first),
 *          a press picking one.
 * Boundary: the set is `EMOJI_SET` and the search `emojiMatches` (English words for now). Each emoji is a button named
 *           by its words; arrow keys are Tab order, kept short by the categories. No skin tones yet.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1,
 *          2.5.8, 4.1.2.
 */
import { cn } from "@heroui/react";
import { useId, useState, type ReactElement } from "react";

import { EMOJI_SET } from "#core/constants/emoji-set.constant";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { emojiMatches } from "#core/functions/emoji-matches.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SearchField } from "#react/search-field/search-field";
import type { EmojiPickerProps } from "#react/emoji-picker/emoji-picker.props";

/** The words of each emoji, for its name. */
const WORDS = new Map(
  Object.values(EMOJI_SET)
    .flat()
    .map(({ emoji, words }) => [emoji, words]),
);

/** One section of emoji buttons. */
function Section({
  title,
  emoji,
  onSelect,
}: {
  readonly title: string;
  readonly emoji: readonly string[];
  readonly onSelect: (emoji: string) => void;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid gap-1">
      <h4 id={id} className="sticky top-0 bg-overlay py-1 text-xs font-medium text-muted">
        {title}
      </h4>
      <div className="grid grid-cols-8 gap-0.5">
        {emoji.map((each) => (
          <button
            key={each}
            type="button"
            aria-label={WORDS.get(each) ?? each}
            onClick={() => onSelect(each)}
            className="grid size-9 place-items-center rounded-[var(--radius-control)] text-xl outline-none hover:bg-default focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus"
          >
            {/* Drawn from an attribute, not text: the name says what it is, and axe cannot match a glyph against a name. */}
            <span
              aria-hidden="true"
              data-glyph={each}
              className="before:content-[attr(data-glyph)]"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/** The default for an unset list prop: one stable empty array, not a new one each render. */
const NONE: readonly never[] = [];

/** A searchable grid of emoji. */
export function EmojiPicker({
  onSelect,
  recent = NONE,
  label,
  className,
}: EmojiPickerProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.emoji_picker;
  const [query, setQuery] = useState("");
  const pick = (emoji: string) => onSelect?.(emoji);
  const found = query.trim() ? emojiMatches(query) : null;
  return (
    <div
      role="group"
      aria-label={label ?? t(K.label)}
      className={cn("grid w-80 max-w-full gap-2", className) ?? ""}
    >
      <SearchField
        aria-label={t(K.search)}
        placeholder={t(K.search)}
        value={query}
        onChange={setQuery}
      />
      <div className="grid max-h-72 gap-3 overflow-y-auto pe-1">
        {found ? (
          found.length > 0 ? (
            <Section title={t(K.search)} emoji={found} onSelect={pick} />
          ) : (
            <p role="status" className="py-6 text-center text-sm text-muted">
              {t(K.no_matches)}
            </p>
          )
        ) : (
          <>
            {recent.length > 0 ? (
              <Section title={t(K.recent)} emoji={recent} onSelect={pick} />
            ) : null}
            {(Object.keys(EMOJI_SET) as (keyof typeof EMOJI_SET)[]).map((category) => (
              <Section
                key={category}
                title={t(K[category])}
                emoji={EMOJI_SET[category].map(({ emoji }) => emoji)}
                onSelect={pick}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
