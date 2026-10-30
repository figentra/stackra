/**
 * Stackra file contract:
 * Purpose: the web `Timeline`: an activity feed. Each entry is a marker (an icon in a tone's disc, or a dot) on a line
 *          that runs down the reading-start side, the actor and what they did, the time, and an optional body; the
 *          entries sit under day headings ("Today", "Yesterday", then the date). `compact` is one line per entry.
 * Boundary: a list per day under a heading; each time is a `<time>` with its instant. Dates and times follow the
 *           provider's locale and digits; actor names are isolated (`<bdi>`) so a Latin name keeps its order in Arabic.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1; STA-1371.
 */
import { cn } from "@heroui/react";
import { dateTimeFormatIn } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { use, useState, type ReactElement } from "react";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { MARKER_TONE_CLASS_NAME } from "#core/constants/marker-tone-class-name.constant";
import { timelineDaysOf } from "#core/functions/timeline-days-of.function";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { useUiText } from "#react/hooks/use-ui-text";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { TimelineProps } from "#react/timeline/timeline.props";

/** The timeline's keys. */
const K = DISPLAY_KEYS.ui.timeline;

/** An activity feed grouped by day. */
export function Timeline({
  items,
  groupByDay = true,
  variant = "default",
  label,
  timeZone,
  now,
  className,
}: TimelineProps): ReactElement {
  const t = useUiText();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const numerals = useNumerals();
  const zone = timeZone ? { timeZone } : {};
  const time = dateTimeFormatIn(locale, { timeStyle: "short", ...zone }, numerals);
  const date = dateTimeFormatIn(locale, { dateStyle: "medium", ...zone }, numerals);
  const isCompact = variant === "compact";
  // The first render's moment, kept: "today" must not move between renders.
  const [mounted] = useState(() => new Date());
  const today = now ?? mounted;
  const days = groupByDay
    ? timelineDaysOf(items, today, timeZone)
    : [{ key: "all", daysAgo: Number.NaN, at: today, items }];
  const heading = (daysAgo: number, at: Date) =>
    daysAgo === 0 ? t(K.today) : daysAgo === 1 ? t(K.yesterday) : date.format(at);
  return (
    <section
      aria-label={label ?? t(K.label)}
      data-slot="timeline"
      className={cn("grid", isCompact ? "gap-3" : "gap-5", className)}
    >
      {days.map((day) => (
        <div key={day.key} className="grid gap-2">
          {groupByDay ? (
            <h3 className="m-0 text-xs font-medium text-muted">{heading(day.daysAgo, day.at)}</h3>
          ) : null}
          <ol className="m-0 grid list-none p-0">
            {day.items.map((item, index) => {
              const at = new Date(item.at);
              const isLast = index === day.items.length - 1;
              return (
                <li key={item.id} className="relative flex gap-3">
                  {isLast ? null : (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute bottom-0 w-px bg-muted/40",
                        isCompact ? "start-[0.6875rem] top-6" : "start-[0.9375rem] top-8",
                      )}
                    />
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "relative flex shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5",
                      isCompact ? "size-6" : "size-8",
                      MARKER_TONE_CLASS_NAME[item.tone ?? "default"],
                    )}
                  >
                    {item.icon ? (
                      <SlotIcon icon={item.icon} />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <div
                    className={cn(
                      "min-w-0 flex-1",
                      isCompact ? "flex items-baseline gap-2 pb-2" : "grid gap-1 pb-5",
                      isLast && "pb-0",
                    )}
                  >
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm">
                      <span className={cn("min-w-0", isCompact && "truncate")}>
                        {item.actor ? (
                          <>
                            <bdi className="font-medium">{item.actor}</bdi>{" "}
                          </>
                        ) : null}
                        {item.title}
                      </span>
                      <time
                        dateTime={at.toISOString()}
                        className="ms-auto shrink-0 text-xs text-muted tabular-nums"
                      >
                        {time.format(at)}
                      </time>
                    </div>
                    {!isCompact && item.body ? (
                      <div className="text-sm text-muted">{item.body}</div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
