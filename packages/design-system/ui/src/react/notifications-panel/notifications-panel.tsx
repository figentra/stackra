/**
 * Stackra file contract:
 * Purpose: the web `NotificationsPanel`: a header bell `IconButton` with the unread count on a `Badge`, opening a
 *          `Popover` that lists the notifications under their group headings, with mark-all-read, per-row press and
 *          dismiss, an empty state and a footer. When the unread count rises the bell wiggles and the badge bumps,
 *          unless the viewer reduces motion. `isInline` shows the same panel in place, as a `Card` under its heading.
 * Boundary: the caller owns the items and their read state. Swipe to dismiss is native's; web dismisses by the row's
 *           button. The animations run on the Web Animations API's individual `rotate` and `scale`, so they compose
 *           with the badge's own placement transform. Default words come from the `ui` catalogue.
 * Runtime: browser
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 2.3.3 and SC 4.1.2.
 */
import { cn } from "@heroui/react";
import { Bell } from "@stackra/icons/react/lucide-icons";
import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { badgeCountOf } from "#core/functions/badge-count-of.function";
import { groupNotifications } from "#core/functions/group-notifications.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Badge } from "#react/badge/badge";
import { Button } from "#react/button/button";
import { Card } from "#react/card/card";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { NotificationRow } from "#react/notifications-panel/notification-row";
import type { NotificationsPanelProps } from "#react/notifications-panel/notifications-panel.props";
import { Popover } from "#react/popover/popover";

/** The bell's wiggle and the badge's bump when something new arrives. */
const WIGGLE: Keyframe[] = ["0deg", "-14deg", "12deg", "-8deg", "4deg", "0deg"].map((rotate) => ({
  rotate,
}));
const BUMP: Keyframe[] = [{ scale: "1" }, { scale: "1.3" }, { scale: "1" }];

/** A bell that opens the viewer's notifications, grouped, with their unread state. */
export function NotificationsPanel({
  items,
  onItemPress,
  onDismiss,
  onMarkAllRead,
  label,
  title,
  emptyState,
  footer,
  isInline = false,
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
}: NotificationsPanelProps): ReactElement {
  const t = useUiText();
  const K = UI_KEYS.ui.notifications_panel;
  const { locale } = useLocale();
  const isReduced = useReducedMotion() ?? false;
  const headingId = useId();
  const bellRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const unread = items.filter((item) => item.isUnread).length;
  const previous = useRef(unread);

  useEffect(() => {
    const hasArrived = unread > previous.current;
    previous.current = unread;
    if (!hasArrived || isReduced) return;
    // jsdom and old engines have no `animate`; the count still updates without the flourish.
    bellRef.current?.animate?.(WIGGLE, { duration: 600, easing: "ease-in-out" });
    badgeRef.current?.animate?.(BUMP, { duration: 300, easing: "ease-out" });
  }, [unread, isReduced]);

  const count = badgeCountOf(unread, locale);
  const groups = groupNotifications(items);

  const body = (
    <>
      {onMarkAllRead && unread > 0 ? (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onPress={onMarkAllRead}>
            {t(K.mark_all_read)}
          </Button>
        </div>
      ) : null}
      {items.length === 0 ? (
        <p data-slot="notifications-empty" className="py-6 text-center text-sm text-muted">
          {emptyState ?? t(K.empty)}
        </p>
      ) : (
        <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
          {groups.map((group, index) => {
            const id = `${headingId}-${index}`;
            return (
              <section
                key={group.heading ?? `none-${index}`}
                {...(group.heading === undefined ? {} : { "aria-labelledby": id })}
              >
                {group.heading === undefined ? null : (
                  <h3 id={id} className="px-1 pt-2 text-xs font-medium text-muted">
                    {group.heading}
                  </h3>
                )}
                <ul className="flex flex-col">
                  {group.items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onPress={onItemPress}
                      onDismiss={onDismiss}
                      dismissLabel={t(K.dismiss)}
                      unreadLabel={t(K.unread)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      {footer == null ? null : <div className="border-t border-border pt-2">{footer}</div>}
    </>
  );

  if (isInline)
    return (
      <Card
        role="region"
        aria-labelledby={headingId}
        data-slot="notifications-panel"
        className={cn("w-full max-w-[28rem]", className) ?? ""}
      >
        <Card.Header>
          <Card.Title id={headingId} level={3}>
            {title ?? t(K.title)}
          </Card.Title>
        </Card.Header>
        <Card.Content className="grid gap-1">{body}</Card.Content>
      </Card>
    );

  return (
    <Popover
      {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}
      title={title ?? t(K.title)}
      placement="bottom"
      align="end"
      className={cn("w-[22rem] max-w-[calc(100vw-2rem)]", className) ?? ""}
      trigger={
        <Badge.Anchor>
          <IconButton
            variant="ghost"
            label={label ?? (unread > 0 ? t(K.label_unread, { count: unread }) : t(K.label))}
            icon={
              <span ref={bellRef} data-slot="notifications-bell" className="inline-flex">
                <Bell aria-hidden size={20} />
              </span>
            }
          />
          {count === "" ? null : (
            <Badge ref={badgeRef} tone="danger" size="sm">
              {count}
            </Badge>
          )}
        </Badge.Anchor>
      }
    >
      {body}
    </Popover>
  );
}
