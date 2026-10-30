/**
 * Stackra file contract:
 * Purpose: the native `MentionInput` on the house TextArea: typing `@` at the start of a word shows, under the box, the
 *          people whose name starts with what follows it, at the caret; pressing one writes `@Name ` in place of the
 *          query, with a selection haptic, and the ids of the people the text mentions are reported with
 *          `onMentionsChange`.
 * Boundary: the caret is read from `onSelectionChange` and set after a choice through `selection`. The list is a
 *           group named "People to mention" of buttons, each read by the person's name; rows lay out from the start
 *           edge, so they mirror in right-to-left.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0060 (right-to-left); STA-1371 (wave
 *          C, owner request 2026-10-29).
 */
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import type { CommentPerson } from "#contracts/types/comment-person.type";
import { INPUT_KEYS } from "#core/constants/input-keys.constant";
import { mentionQueryOf } from "#core/functions/mention-query-of.function";
import { mentionSegmentsOf } from "#core/functions/mention-segments-of.function";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Avatar } from "#native/avatar/avatar";
import { haptics } from "#native/haptics/haptics";
import type { MentionInputProps } from "#native/mention-input/mention-input.props";
import { Text } from "#native/text/text";
import { TextArea } from "#native/text-area/text-area";
import { useUiText } from "#react/hooks/use-ui-text";

/** A text box that suggests people after `@`. */
export function MentionInput({
  people,
  onMentionsChange,
  rows = 3,
  maxSuggestions = 6,
  value,
  defaultValue,
  onChange,
  ...rest
}: MentionInputProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultValue ?? "");
  const text = value ?? own;
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();
  const caret = selection?.end ?? text.length;
  const query = mentionQueryOf(text.slice(0, caret));
  const matches =
    query === null
      ? []
      : people
          .filter((person) =>
            normalizeSearchText(person.name).startsWith(normalizeSearchText(query)),
          )
          .slice(0, maxSuggestions);

  const change = (next: string) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
    onMentionsChange?.(mentionSegmentsOf(next, people).mentions);
  };

  const choose = (person: CommentPerson) => {
    haptics.play("selection");
    const start = caret - (query?.length ?? 0) - 1;
    const inserted = `@${person.name} `;
    change(text.slice(0, start) + inserted + text.slice(caret));
    setSelection({ start: start + inserted.length, end: start + inserted.length });
  };

  return (
    <View className="gap-2">
      <TextArea
        {...omitUndefined(rest)}
        rows={rows}
        value={text}
        onChange={(next) => {
          // The caret moved by the edit's length change from where the selection ended.
          const at = Math.max(0, caret + next.length - text.length);
          setSelection({ start: at, end: at });
          change(next);
        }}
        {...(selection ? { selection } : {})}
        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
      />
      {matches.length > 0 ? (
        <View
          accessibilityRole="list"
          accessibilityLabel={t(INPUT_KEYS.ui.mention_input.people)}
          className="overflow-hidden rounded-[var(--radius-container)] border border-separator bg-overlay"
        >
          {matches.map((person) => (
            <Pressable
              key={person.id}
              accessibilityRole="button"
              accessibilityLabel={person.name}
              className="min-h-11 flex-row items-center gap-2 px-3 active:bg-default"
              onPress={() => choose(person)}
            >
              <Avatar name={person.name} src={person.avatar} size="sm" />
              <Text isTruncated className="flex-1">
                {person.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
