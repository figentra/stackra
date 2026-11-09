/**
 * Stackra file contract:
 * Purpose: `useSchedulingBoardState(props, locale, numerals)`, the state every runtime's SchedulingBoard shares: the
 *          view and the day (each controlled or its own), previous / next / Today, the columns and rows, each row's
 *          placed items with pending moves applied and its shading, the words it writes in the chosen calendar, and the
 *          drag arithmetic: snapping, nudging, conflicts with words, and the commits that call the screen back.
 * Boundary: a React hook with no rendering; the runtimes draw the board and turn pointer, keyboard or gesture input
 *           into drafts. A move is held where it was dropped while the screen's promise is open, and put back on
 *           `false`; once settled it is kept until the screen passes new items.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits); shared modules step 4a (LEADER, 2026-11-09).
 */
import {
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
  type CalendarDate,
} from "@internationalized/date";
import { dateTimeFormatIn, numberFormatIn, type NumberingSystem } from "@stackra/i18n";
import { useState } from "react";

import type { SchedulingBoardView } from "#contracts/enums/scheduling-board-view.enum";
import type { SchedulingBoardConflict } from "#contracts/types/scheduling-board-conflict.type";
import type { SchedulingBoardContractProps } from "#contracts/types/scheduling-board-contract-props.type";
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import { calendarLocaleOf } from "#core/functions/calendar-locale-of.function";
import { schedulingColumnsOf } from "#core/functions/scheduling-columns-of.function";
import { schedulingConflictsOf } from "#core/functions/scheduling-conflicts-of.function";
import { schedulingPlacementsOf } from "#core/functions/scheduling-placements-of.function";
import { schedulingPositionOf } from "#core/functions/scheduling-position-of.function";
import { schedulingRowsOf } from "#core/functions/scheduling-rows-of.function";
import { schedulingShadeOf } from "#core/functions/scheduling-shade-of.function";
import { schedulingSnapOf } from "#core/functions/scheduling-snap-of.function";
import { schedulingTimeAt } from "#core/functions/scheduling-time-at.function";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";
import { useUiText } from "#react/hooks/use-ui-text";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** The slot lengths that divide an hour; any other `slotMinutes` falls back to 15. */
const SLOTS = new Set([5, 6, 10, 12, 15, 20, 30, 60]);

/** A minute in milliseconds. */
const MINUTE = 60_000;

/** A day in milliseconds; a daylight-saving day is off by its shift, as the columns. */
const DAY = 86_400_000;

/** The words of the board's own conflict reasons. */
const OWN_WORDS: Readonly<Record<string, (typeof K)[keyof typeof K]>> = {
  closure: K.conflict_closure,
  overlap: K.conflict_overlap,
  outside_hours: K.conflict_outside_hours,
  in_past: K.conflict_in_past,
};

/** A day as a UTC instant, for Intl. */
const asUtc = (day: CalendarDate) => day.toDate("UTC");

/** A move the board shows before the screen's items catch up. */
interface Override {
  /** The item's rows after the move. */
  readonly resourceIds: readonly string[];
  /** Its start after the move. */
  readonly start: Date;
  /** Its end after the move. */
  readonly end: Date;
  /** True while the screen's promise is open. */
  readonly pending: boolean;
  /** The items it was made against; a settled override lapses once new items arrive. */
  readonly against: readonly SchedulingBoardItem[];
}

/** The shared SchedulingBoard state. */
export function useSchedulingBoardState(
  props: SchedulingBoardContractProps,
  locale: string,
  numerals?: NumberingSystem,
): SchedulingBoardState {
  const t = useUiText();
  const timeZone = props.timeZone ?? getLocalTimeZone();
  // "Now" is read once, at mount: reading the clock on every render would make rendering impure.
  const [mountedAt] = useState(() => new Date());
  const now = props.now ?? mountedAt;
  const today = toCalendarDate(fromDate(now, timeZone));
  const [ownView, setOwnView] = useState<SchedulingBoardView>(props.defaultView ?? "day");
  const [ownDate, setOwnDate] = useState<CalendarDate>(props.defaultDate ?? today);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [overrides, setOverrides] = useState<ReadonlyMap<string, Override>>(() => new Map());
  const [announcement, announce] = useState("");
  const view = props.view ?? ownView;
  const date = props.date ?? ownDate;
  const setView = (next: SchedulingBoardView) => {
    setOwnView(next);
    props.onViewChange?.(next);
  };
  const setDate = (next: CalendarDate) => {
    setOwnDate(next);
    props.onDateChange?.(next);
  };
  const slotMinutes = SLOTS.has(props.slotMinutes ?? 15) ? (props.slotMinutes ?? 15) : 15;
  const startHour = Math.min(23, Math.max(0, props.startHour ?? 0));
  const endHour = Math.min(24, Math.max(startHour + 1, props.endHour ?? 24));
  const timelineDays = Math.min(62, Math.max(1, Math.round(props.timelineDays ?? 14)));
  const columns = schedulingColumnsOf(view, date, {
    timeZone,
    slotMinutes,
    startHour,
    endHour,
    timelineDays,
    locale,
  });
  const readOnly = props.readOnly === true;
  const tag = calendarLocaleOf(locale, props.calendar);
  const format = (options: Intl.DateTimeFormatOptions) => dateTimeFormatIn(tag, options, numerals);
  const utc = { timeZone: "UTC" } as const;
  const full = format({ dateStyle: "full", ...utc });
  const medium = format({ dateStyle: "medium", ...utc });
  const dayLabel = format({ weekday: "short", day: "numeric", month: "short", ...utc });
  const time = format({ timeStyle: "short", timeZone });
  const shortDate = format({ day: "numeric", month: "short", timeZone });
  const count = numberFormatIn(locale, undefined, numerals);

  const items = props.items.map((item) => {
    const override = overrides.get(item.id);
    return override && (override.pending || override.against === props.items)
      ? { ...item, resourceIds: override.resourceIds, start: override.start, end: override.end }
      : item;
  });
  const resources = new Map(props.resources.map((resource) => [resource.id, resource]));
  const rows = schedulingRowsOf(props.resources, collapsed);
  const resourceRows = rows.flatMap((row) => (row.kind === "resource" ? [row.resource.id] : []));
  const isTimeline = view === "timeline";
  const step = isTimeline ? DAY : slotMinutes * MINUTE;
  const snap = (at: Date) =>
    isTimeline
      ? toCalendarDate(fromDate(new Date(at.getTime() + DAY / 2), timeZone)).toDate(timeZone)
      : schedulingSnapOf(at, slotMinutes, timeZone);
  const timeOf = (item: SchedulingBoardItem) =>
    item.allDay === true || isTimeline
      ? `${shortDate.format(item.start)} – ${shortDate.format(new Date(item.end.getTime() - 1))}`
      : `${time.format(item.start)} – ${time.format(item.end)}`;
  const first = columns[0];
  const last = columns.at(-1);
  const nowPosition = schedulingPositionOf(now, columns);
  const nowInside =
    first !== undefined &&
    last !== undefined &&
    now >= first.start &&
    now < last.end &&
    schedulingTimeAt(nowPosition, columns).getTime() === now.getTime();
  const conflictsOf = (draft: SchedulingBoardDraft): readonly SchedulingBoardConflict[] => [
    ...schedulingConflictsOf(draft, {
      resources: props.resources,
      items,
      workingTime: props.workingTime,
      now,
    }).map((conflict) => {
      const words = OWN_WORDS[conflict.reason];
      return words ? { ...conflict, message: t(words) } : conflict;
    }),
    ...(props.conflictsOf?.(draft) ?? []),
  ];
  const labelOf = (id: string) => resources.get(id)?.label ?? id;
  const rangeWords = (draft: SchedulingBoardDraft) =>
    timeOf({
      id: "",
      resourceIds: [],
      kind: "booking",
      title: "",
      start: draft.start,
      end: draft.end,
    });

  return {
    view,
    setView,
    date,
    move: (direction) => {
      const span =
        view === "day" ? { days: 1 } : view === "week" ? { weeks: 1 } : { days: timelineDays };
      setDate(direction === 1 ? date.add(span) : date.subtract(span));
    },
    goToday: () => setDate(today),
    heading:
      view === "day" || !first || !last
        ? full.format(asUtc(date))
        : `${medium.format(asUtc(first.day))} – ${medium.format(asUtc(last.day))}`,
    slotMinutes,
    columns,
    rows,
    toggleGroup: (group) =>
      setCollapsed((open) => {
        const next = new Set(open);
        if (next.has(group)) next.delete(group);
        else next.add(group);
        return next;
      }),
    // shortcut: every row is laid out on each render; virtualise the rows here past about 200 resources.
    placementsOf: (resourceId, ancestors) =>
      schedulingPlacementsOf(items, resourceId, ancestors, columns),
    shadeOf: (resourceId) => schedulingShadeOf(resourceId, props.workingTime, columns),
    pastLength: nowPosition,
    nowAt: nowInside ? nowPosition : null,
    readOnly,
    canMove: (placed) =>
      !readOnly &&
      !placed.inherited &&
      placed.item.movable !== false &&
      props.onItemChange !== undefined,
    canResize: (placed) =>
      !readOnly &&
      !placed.inherited &&
      placed.item.resizable !== false &&
      placed.item.allDay !== true &&
      props.onItemChange !== undefined,
    isPending: (itemId) => overrides.get(itemId)?.pending === true,
    columnLabelOf: (column) =>
      isTimeline ? dayLabel.format(asUtc(column.day)) : time.format(column.start),
    dayLabelOf: (day) => dayLabel.format(asUtc(day)),
    dayMarkOf: (day) => props.dayMarks?.find((mark) => mark.date.compare(day) === 0),
    dayStatusLabelOf: (mark) =>
      mark.status === "rest_day"
        ? t(K.day_rest_day)
        : mark.status === "holiday"
          ? t(K.day_holiday)
          : mark.status === "uncertain"
            ? t(K.day_uncertain)
            : "",
    timeOf,
    nameOf: (item, resource) =>
      item.status
        ? t(K.item_status, {
            title: item.title,
            time: timeOf(item),
            resource: resource.label,
            status: item.status,
          })
        : t(K.item, { title: item.title, time: timeOf(item), resource: resource.label }),
    slotNameOf: (resource, column) =>
      t(K.slot, {
        resource: resource.label,
        time: isTimeline
          ? full.format(asUtc(column.day))
          : `${full.format(asUtc(column.day))} ${time.format(column.start)}`,
      }),
    countdownOf: (item) => {
      if (!item.expiresAt) return null;
      const minutes = Math.ceil((item.expiresAt.getTime() - now.getTime()) / MINUTE);
      if (minutes <= 0) return null;
      const unit = minutes >= 60 ? "hour" : "minute";
      const left = numberFormatIn(
        locale,
        { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: 0 },
        numerals,
      );
      return t(K.expires, {
        time: left.format(unit === "hour" ? Math.floor(minutes / 60) : minutes),
      });
    },
    fillOf: (item) =>
      item.fill
        ? t(K.fill, { used: count.format(item.fill.used), total: count.format(item.fill.total) })
        : null,
    inheritedLabelOf: (item, ancestors) =>
      t(K.inherited, {
        parent: labelOf(ancestors.find((id) => item.resourceIds.includes(id)) ?? ""),
      }),
    snap,
    timeAt: (position) => snap(schedulingTimeAt(position, columns)),
    nudge: (draft, steps, rowSteps, resize) => {
      // by columns, not by time, so a week's step from its last shown slot lands on the next day's first
      const along = (at: Date) =>
        snap(schedulingTimeAt(schedulingPositionOf(at, columns) + steps, columns));
      if (resize) {
        const end = Math.max(draft.start.getTime() + step, along(draft.end).getTime());
        return { ...draft, end: new Date(end) };
      }
      const index = resourceRows.indexOf(draft.resourceId);
      const target =
        draft.change === "select" || index === -1
          ? draft.resourceId
          : (resourceRows[Math.min(resourceRows.length - 1, Math.max(0, index + rowSteps))] ??
            draft.resourceId);
      return {
        ...draft,
        resourceId: target,
        start: along(draft.start),
        end: new Date(along(draft.start).getTime() + draft.end.getTime() - draft.start.getTime()),
      };
    },
    conflictsOf,
    commitRange: (draft) => {
      props.onSelectRange?.({
        resourceId: draft.resourceId,
        start: draft.start,
        end: draft.end,
        conflicts: conflictsOf(draft),
      });
      announce(t(K.selected, { resource: labelOf(draft.resourceId), time: rangeWords(draft) }));
    },
    commitChange: (draft) => {
      const item = items.find((entry) => entry.id === draft.itemId);
      if (!item || draft.itemId === null || !props.onItemChange) return;
      const from = draft.fromResourceId ?? draft.resourceId;
      const result = props.onItemChange({
        itemId: draft.itemId,
        change: draft.change === "resize" ? "resize" : "move",
        fromResourceId: from,
        toResourceId: draft.resourceId,
        start: draft.start,
        end: draft.end,
        conflicts: conflictsOf(draft),
      });
      const itemId = draft.itemId;
      const settle = (pending: boolean) =>
        setOverrides((open) =>
          new Map(open).set(itemId, {
            resourceIds: item.resourceIds.map((id) => (id === from ? draft.resourceId : id)),
            start: draft.start,
            end: draft.end,
            pending,
            against: props.items,
          }),
        );
      const putBack = () => {
        setOverrides((open) => {
          const next = new Map(open);
          next.delete(itemId);
          return next;
        });
        announce(t(K.reverted, { title: item.title }));
      };
      announce(
        t(K.moved, {
          title: item.title,
          resource: labelOf(draft.resourceId),
          time: rangeWords(draft),
        }),
      );
      if (result instanceof Promise) {
        settle(true);
        void result.then((ok) => (ok ? settle(false) : putBack())).catch(putBack);
      } else {
        settle(false);
      }
    },
    announce,
    announcement,
    startWordsOf: (draft, title, touch = false) =>
      title === null
        ? t(touch ? K.selecting_touch : K.selecting, { time: rangeWords(draft) })
        : t(touch ? K.moving_touch : K.moving, { title }),
    resourceOf: (id) => resources.get(id),
  };
}
