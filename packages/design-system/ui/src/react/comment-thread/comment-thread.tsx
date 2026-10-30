/**
 * Stackra file contract:
 * Purpose: the web `CommentThread`: comments with avatar, name, time and text whose `@mentions` are marked; a reply box
 *          that lists matching people while an `@name` is being typed; and resolve / reopen.
 * Boundary: the thread reports replies and the resolved state; the app stores them. Each comment's text takes its
 *           direction from its first letter, and names are isolated so mixed scripts read right.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0225 (comments); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1; STA-1371.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useState } from "react";
import { useLocale } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { mentionQueryOf } from "#core/functions/mention-query-of.function";
import { mentionSegmentsOf } from "#core/functions/mention-segments-of.function";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";
import { Avatar } from "#react/avatar/avatar";
import { Button } from "#react/button/button";
import { Chip } from "#react/chip/chip";
import type { CommentThreadProps } from "#react/comment-thread/comment-thread.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { TextArea } from "#react/text-area/text-area";

/** The words' keys. */
const K = UI_KEYS.ui.comment_thread;

/** The default for an unset list prop: one stable empty array, not a new one each render. */
const NONE: readonly never[] = [];

/** A thread of comments. */
export function CommentThread({
  comments,
  people = NONE,
  onReply,
  isResolved = false,
  onResolvedChange,
  label,
  className,
}: CommentThreadProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
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
    <section
      aria-label={label}
      data-slot="comment-thread"
      className={cn("flex flex-col gap-3", className)}
    >
      {isResolved || onResolvedChange ? (
        <div className="flex items-center justify-between gap-2">
          {isResolved ? (
            <Chip size="sm" tone="success" variant="soft" startIcon="check">
              {t(K.resolved)}
            </Chip>
          ) : (
            <span />
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
        </div>
      ) : null}
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar name={comment.author.name} src={comment.author.avatar} size="sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <bdi className="text-sm font-semibold">{comment.author.name}</bdi>
                <time dateTime={comment.createdAt} className="text-xs text-muted">
                  {when.format(new Date(comment.createdAt))}
                </time>
              </div>
              <p dir="auto" className="m-0 text-sm whitespace-pre-wrap">
                {mentionSegmentsOf(comment.body, people).segments.map((segment, index) =>
                  segment.person ? (
                    <bdi
                      // oxlint-disable-next-line react/no-array-index-key -- segments are cut from the comment in order and may repeat; their place is their identity
                      key={index}
                      className="rounded-[var(--radius-control-inner)] bg-accent-soft px-0.5 font-medium text-accent-soft-foreground"
                    >
                      {segment.text}
                    </bdi>
                  ) : (
                    // oxlint-disable-next-line react/no-array-index-key -- segments are cut from the comment in order and may repeat; their place is their identity
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {onReply && !isResolved ? (
        <div className="flex flex-col gap-2">
          <TextArea
            aria-label={t(K.reply)}
            placeholder={t(K.reply)}
            value={draft}
            onChange={setDraft}
            rows={2}
          />
          {matches.length > 0 ? (
            <ul aria-label={t(K.people)} className="m-0 flex list-none flex-wrap gap-1 p-0">
              {matches.map((person) => (
                <li key={person.id}>
                  <Button
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
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex justify-end">
            <Button size="sm" startIcon="send" onPress={send} isDisabled={draft.trim() === ""}>
              {t(K.send)}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
