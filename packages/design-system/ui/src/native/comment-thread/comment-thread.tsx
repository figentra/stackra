/**
 * Stackra file contract:
 * Purpose: the native `CommentThread`: comments with avatar, name, time and text whose `@mentions` are marked; a reply
 *          box that offers matching people while an `@name` is typed; and resolve / reopen.
 * Boundary: the thread reports replies and the resolved state; the app stores them.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0225 (comments); STA-1371.
 */
import { type ReactElement, use, useState } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { mentionQueryOf } from "#core/functions/mention-query-of.function";
import { mentionSegmentsOf } from "#core/functions/mention-segments-of.function";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Avatar } from "#native/avatar/avatar";
import { Button } from "#native/button/button";
import { Chip } from "#native/chip/chip";
import type { CommentThreadProps } from "#native/comment-thread/comment-thread.props";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { Text } from "#native/text/text";
import { TextArea } from "#native/text-area/text-area";

/** The words' keys. */
const K = UI_KEYS.ui.comment_thread;

/** The `people` default, one array for every render. */
const NO_PEOPLE: NonNullable<CommentThreadProps["people"]> = [];

/** A thread of comments. */
export function CommentThread({
  comments,
  people = NO_PEOPLE,
  onReply,
  isResolved = false,
  onResolvedChange,
  label,
  className,
}: CommentThreadProps): ReactElement {
  const t = useUiText();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const [draft, setDraft] = useState("");
  const query = mentionQueryOf(draft);
  const matches =
    query === null
      ? []
      : people
          .filter((person) =>
            normalizeSearchText(person.name).startsWith(normalizeSearchText(query)),
          )
          .slice(0, 5);
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const send = () => {
    const body = draft.trim();
    if (!body || !onReply) return;
    onReply(body, mentionSegmentsOf(body, people).mentions);
    setDraft("");
  };
  return (
    <View accessibilityLabel={label} className={["gap-3", className].filter(Boolean).join(" ")}>
      {isResolved || onResolvedChange ? (
        <View className="flex-row items-center justify-between">
          {isResolved ? (
            <Chip size="sm" tone="success" variant="soft" startIcon="check">
              {t(K.resolved)}
            </Chip>
          ) : (
            <View />
          )}
          {onResolvedChange ? (
            <Button
              size="sm"
              variant="ghost"
              startIcon={isResolved ? "rotate-ccw" : "check"}
              onPress={() => onResolvedChange(!isResolved)}
            >
              {isResolved ? t(K.reopen) : t(K.resolve)}
            </Button>
          ) : null}
        </View>
      ) : null}
      {comments.map((comment) => (
        <View key={comment.id} className="flex-row gap-3">
          <Avatar name={comment.author.name} src={comment.author.avatar} size="sm" />
          <View className="flex-1 gap-0.5">
            <View className="flex-row flex-wrap items-baseline gap-x-2">
              <Text className="text-sm font-semibold">{comment.author.name}</Text>
              <Text type="caption" tone="muted">
                {when.format(new Date(comment.createdAt))}
              </Text>
            </View>
            <Text type="small">
              {mentionSegmentsOf(comment.body, people).segments.map((segment, index) =>
                segment.person ? (
                  // oxlint-disable-next-line react/no-array-index-key -- parsed segments of one comment have no identity but their place in the text
                  <Text key={index} className="font-medium text-accent-soft-foreground">
                    {segment.text}
                  </Text>
                ) : (
                  // oxlint-disable-next-line react/no-array-index-key -- parsed segments of one comment have no identity but their place in the text
                  <Text key={index}>{segment.text}</Text>
                ),
              )}
            </Text>
          </View>
        </View>
      ))}
      {onReply && !isResolved ? (
        <View className="gap-2">
          <TextArea label={t(K.reply)} placeholder={t(K.reply)} value={draft} onChange={setDraft} />
          {matches.length > 0 ? (
            <View accessibilityLabel={t(K.people)} className="flex-row flex-wrap gap-1">
              {matches.map((person) => (
                <Button
                  key={person.id}
                  size="sm"
                  variant="tertiary"
                  onPress={() =>
                    setDraft(
                      `${draft.slice(0, draft.length - (query?.length ?? 0) - 1)}@${person.name} `,
                    )
                  }
                >
                  {`@${person.name}`}
                </Button>
              ))}
            </View>
          ) : null}
          <View className="flex-row justify-end">
            <Button size="sm" startIcon="send" onPress={send} isDisabled={draft.trim() === ""}>
              {t(K.send)}
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}
