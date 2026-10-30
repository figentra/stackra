/**
 * Stackra file contract:
 * Purpose: the web `NotificationRow`: one notification as a list item: the tone's icon, the title (bold while unread),
 *          the detail and time, an accent unread dot that also says "Unread" to screen readers, a React Aria button
 *          over the text when the panel takes presses, and a dismiss button when it takes dismisses.
 * Boundary: internal to the NotificationsPanel; not exported.
 * Runtime: browser
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 1.4.1 and
 *          SC 2.1.1.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { Button as AriaButton } from "react-aria-components";

import { CloseButton } from "#react/close-button/close-button";
import { FeedbackIcon } from "#react/feedback-icon/feedback-icon";
import type { NotificationRowProps } from "#react/notifications-panel/notification-row.props";

/** The 8 px unread dot, round by the theme's full radius. */
const DOT_STYLE = { width: 8, height: 8, borderRadius: "var(--radius-full)" } as const;

/** One notification in the panel's list. */
export function NotificationRow({
  item,
  onPress,
  onDismiss,
  dismissLabel,
  unreadLabel,
}: NotificationRowProps): ReactElement {
  const body = (
    <>
      <span className="mt-0.5 shrink-0">
        <FeedbackIcon tone={item.tone ?? "default"} icon={item.icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
        <span className={cn("text-sm", item.isUnread ? "font-semibold" : "font-normal")}>
          {item.title}
        </span>
        {item.description == null ? null : (
          <span className="text-xs text-muted">{item.description}</span>
        )}
        {item.time == null ? null : <span className="text-xs text-muted">{item.time}</span>}
      </span>
      {item.isUnread ? (
        <span
          data-slot="notification-unread"
          className="mt-1.5 shrink-0 bg-accent"
          style={DOT_STYLE}
        >
          <span className="sr-only">{unreadLabel}</span>
        </span>
      ) : null}
    </>
  );
  const layout = "flex min-w-0 flex-1 items-start gap-3 px-1 py-2";
  return (
    <li
      data-slot="notification"
      {...(item.isUnread ? { "data-unread": "" } : {})}
      className="flex items-start gap-1"
    >
      {onPress ? (
        <AriaButton
          className={
            cn(
              layout,
              "cursor-pointer outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus",
            ) ?? ""
          }
          onPress={() => onPress(item.id)}
        >
          {body}
        </AriaButton>
      ) : (
        <div className={layout}>{body}</div>
      )}
      {onDismiss ? (
        <CloseButton className="mt-1" label={dismissLabel} onPress={() => onDismiss(item.id)} />
      ) : null}
    </li>
  );
}
