/**
 * Stackra file contract:
 * Purpose: the native `SchedulingBoard`: resources down the side and time across, in day, week and timeline views. A
 *          header holds the span's heading, Today, previous and next, and the view as a segmented control; the body
 *          scrolls down the rows (group headings that hide or show their resources, each resource's label with its
 *          avatar, indented under its parent) and across the time area: the column header and one lane per row with
 *          shading, working time, closures, blocks and the now line. Empty slots select a range; blocks move and
 *          resize by long press and drag, or by accessibility actions; a drag shows its preview and its conflicts.
 * Boundary: a pure view over `useSchedulingBoardState`: it never fetches or writes, never refuses a drop, and reports
 *           through the contract's callbacks. Words are `ui::scheduling_board.*`; dates are in the customer's digits
 *           and calendar. Columns run from the reading start and chevrons mirror in right-to-left. Colours, radii
 *           and spacing are tokens.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.7, 2.5.8 and 4.1.2; shared
 *          modules step 4a (LEADER, 2026-11-09).
 */
import { useNumerals } from "@stackra/i18n/react";
import { Fragment, use, useEffect, useState, type ReactElement } from "react";
import { AccessibilityInfo, Pressable, ScrollView, View } from "react-native";

import { SchedulingBoardView } from "#contracts/enums/scheduling-board-view.enum";
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";
import type { SchedulingSpan } from "#core/types/scheduling-span.type";
import { useSchedulingBoardState } from "#react/hooks/use-scheduling-board-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Avatar } from "#native/avatar/avatar";
import { useDirection } from "#native/bidi/use-direction";
import { Button } from "#native/button/button";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { EmptyState } from "#native/empty-state/empty-state";
import { Heading } from "#native/heading/heading";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { SchedulingBoardLane } from "#native/scheduling-board/scheduling-board-lane";
import { SCHEDULING_BOARD_METRICS } from "#native/scheduling-board/scheduling-board-metrics.constant";
import type { SchedulingBoardProps } from "#native/scheduling-board/scheduling-board.props";
import { SegmentedControl } from "#native/segmented-control/segmented-control";
import { Skeleton } from "#native/skeleton/skeleton";
import { Text } from "#native/text/text";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** The board's sizes. */
const M = SCHEDULING_BOARD_METRICS;

/** The placeholder rows drawn while the schedule loads. */
const LOADING_ROWS = ["first", "second", "third", "fourth"] as const;

/** The props of the column header. */
interface ColumnHeaderProps {
  /** The shared state. */
  readonly state: SchedulingBoardState;
  /** A column's width in points. */
  readonly width: number;
}

/** The column header: the days on top (week), the hours below (day, week), or each day (timeline). */
function ColumnHeader({ state, width }: ColumnHeaderProps): ReactElement {
  const t = useUiText();
  const { columns } = state;
  const perHour = Math.max(1, Math.round(60 / state.slotMinutes));
  const half = M.headerHeight / 2;
  const markWords = (index: number) => {
    const column = columns[index];
    const mark = column ? state.dayMarkOf(column.day) : undefined;
    return mark ? (mark.label ?? state.dayStatusLabelOf(mark)) : "";
  };
  // The first column of each column's day, for the hour labels.
  const dayStarts: number[] = [];
  for (const [index, column] of columns.entries()) {
    dayStarts.push(column.opensDay ? index : (dayStarts.at(-1) ?? 0));
  }
  const cells = columns.map((column, index) => {
    if (state.view === "timeline") {
      const words = markWords(index);
      return (
        <View
          key={column.start.getTime()}
          className="absolute items-center justify-center border-s border-separator px-0.5"
          style={{ start: index * width, width, height: M.headerHeight }}
        >
          <Text type="caption" isTruncated>
            {state.columnLabelOf(column)}
          </Text>
          {words ? (
            <Text type="caption" tone="muted" isTruncated>
              {words}
            </Text>
          ) : null}
        </View>
      );
    }
    const opensHour = (index - (dayStarts[index] ?? 0)) % perHour === 0;
    const next = columns.findIndex((later, at) => at > index && later.opensDay);
    const dayLength = (next === -1 ? columns.length : next) - index;
    const words = column.opensDay ? markWords(index) : "";
    return (
      <Fragment key={column.start.getTime()}>
        {column.opensDay ? (
          <View
            className="absolute flex-row items-center gap-1 border-s border-separator px-1"
            style={{ start: index * width, width: dayLength * width, top: 0, height: half }}
          >
            <Text type="caption" className="font-medium" isTruncated>
              {state.dayLabelOf(column.day)}
            </Text>
            {words ? (
              <Text type="caption" tone="muted" isTruncated>
                {words}
              </Text>
            ) : null}
          </View>
        ) : null}
        {opensHour ? (
          <View
            className="absolute justify-center px-1"
            style={{ start: index * width, width: perHour * width, top: half, height: half }}
          >
            <Text type="caption" tone="muted" isTruncated>
              {state.columnLabelOf(column)}
            </Text>
          </View>
        ) : null}
      </Fragment>
    );
  });
  return (
    <View
      className="relative border-b border-separator"
      style={{ height: M.headerHeight, width: columns.length * width }}
    >
      {cells}
      {state.nowAt === null ? null : (
        <View
          accessible
          accessibilityLabel={t(K.now)}
          pointerEvents="none"
          className="absolute bottom-0 w-0.5 bg-danger"
          style={{ start: state.nowAt * width, height: half }}
        />
      )}
    </View>
  );
}

/** A board of resources against time. */
export function SchedulingBoard({ className, ...props }: SchedulingBoardProps): ReactElement {
  const t = useUiText();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const state = useSchedulingBoardState(props, locale, useNumerals());
  const sign = useDirection() === "rtl" ? -1 : 1;
  const [draft, setDraft] = useState<SchedulingBoardDraft | null>(null);

  useEffect(() => {
    if (state.announcement) AccessibilityInfo.announceForAccessibility(state.announcement);
  }, [state.announcement]);

  const width =
    state.view === "timeline"
      ? M.timelineDayWidth
      : state.view === "week"
        ? M.weekSlotWidth
        : M.daySlotWidth;
  const conflicts = draft ? state.conflictsOf(draft) : [];
  const canSelect = !state.readOnly && props.onSelectRange !== undefined;

  // Where each resource row sits, for a block dragged up or down.
  const tops: { readonly id: string; readonly top: number }[] = [];
  let y = 0;
  for (const row of state.rows) {
    if (row.kind === "group") {
      y += M.groupHeight;
    } else {
      tops.push({ id: row.resource.id, top: y });
      y += M.rowHeight;
    }
  }
  const rowStepsOf = (resourceId: string, dy: number) => {
    const from = tops.findIndex((entry) => entry.id === resourceId);
    const origin = tops[from];
    if (!origin) return 0;
    const target = origin.top + dy;
    let best = from;
    for (const [index, entry] of tops.entries()) {
      const nearest = tops[best];
      if (nearest && Math.abs(entry.top - target) < Math.abs(nearest.top - target)) best = index;
    }
    return best - from;
  };

  // The rest days and holidays, shaded on every row.
  const dayShade: SchedulingSpan[] = [];
  for (const [index, column] of state.columns.entries()) {
    const status = state.dayMarkOf(column.day)?.status;
    if (status !== "rest_day" && status !== "holiday") continue;
    const last = dayShade.at(-1);
    if (last && last.offset + last.length === index) {
      dayShade[dayShade.length - 1] = { offset: last.offset, length: last.length + 1 };
    } else {
      dayShade.push({ offset: index, length: 1 });
    }
  }

  const draftTime = draft
    ? state.timeOf({
        id: draft.itemId ?? "",
        resourceIds: [draft.resourceId],
        kind: "booking",
        title: "",
        start: draft.start,
        end: draft.end,
      })
    : "";
  const firstRow = tops[0]?.id;
  const lastRow = tops.at(-1)?.id;

  const body = props.isLoading ? (
    <View accessible accessibilityLabel={t(K.loading)} className="gap-2 p-3">
      {LOADING_ROWS.map((key) => (
        <Skeleton key={key} className="h-10 w-full" />
      ))}
    </View>
  ) : state.rows.length === 0 ? (
    <EmptyState title={t(K.empty)} headingLevel={3} className="py-6" />
  ) : (
    <ScrollView className="max-h-128" scrollEnabled={draft === null}>
      <View className="flex-row">
        <View className="border-e border-separator" style={{ width: M.labelWidth }}>
          <View
            className="justify-end border-b border-separator px-2 pb-1"
            style={{ height: M.headerHeight }}
          >
            <Text type="caption" tone="muted" isTruncated>
              {t(K.resources)}
            </Text>
          </View>
          {state.rows.map((row) =>
            row.kind === "group" ? (
              <Pressable
                key={`group-${row.group}`}
                accessibilityRole="button"
                accessibilityLabel={
                  row.collapsed
                    ? t(K.show_group, { group: row.group })
                    : t(K.hide_group, { group: row.group })
                }
                accessibilityState={{ expanded: !row.collapsed }}
                onPress={() => state.toggleGroup(row.group)}
                className="flex-row items-center gap-1 border-b border-separator bg-surface-secondary px-2"
                style={{ height: M.groupHeight }}
              >
                <Icon
                  name={row.collapsed ? "chevron-right" : "chevron-down"}
                  size="sm"
                  tone="muted"
                />
                <Text type="small" className="flex-1 font-medium" isTruncated>
                  {row.group}
                </Text>
              </Pressable>
            ) : (
              <View
                key={row.resource.id}
                className="flex-row items-center gap-2 border-b border-separator pe-2"
                style={{ height: M.rowHeight, paddingStart: M.inset * 2 + row.depth * M.indent }}
              >
                {row.resource.avatarUrl ? (
                  <Avatar name={row.resource.label} src={row.resource.avatarUrl} size="sm" />
                ) : null}
                <Text type="small" className="flex-1" isTruncated>
                  {row.resource.label}
                </Text>
              </View>
            ),
          )}
        </View>
        <ScrollView horizontal className="flex-1" scrollEnabled={draft === null}>
          <View>
            <ColumnHeader state={state} width={width} />
            {state.rows.map((row) =>
              row.kind === "group" ? (
                <View
                  key={`group-${row.group}`}
                  className="border-b border-separator bg-surface-secondary"
                  style={{ height: M.groupHeight, width: state.columns.length * width }}
                />
              ) : (
                <SchedulingBoardLane
                  key={row.resource.id}
                  state={state}
                  resource={row.resource}
                  ancestors={row.ancestors}
                  width={width}
                  sign={sign}
                  isFirstRow={row.resource.id === firstRow}
                  isLastRow={row.resource.id === lastRow}
                  canSelect={canSelect}
                  dayShade={dayShade}
                  draft={draft}
                  conflicts={conflicts}
                  onDraft={setDraft}
                  rowStepsOf={rowStepsOf}
                  onItemPress={props.onItemPress}
                  renderItem={props.renderItem}
                />
              ),
            )}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );

  return (
    <View accessibilityLabel={props.label} className={`w-full gap-3 ${className ?? ""}`}>
      <View className="flex-row items-center gap-1">
        <Heading level={2} type="h4" className="flex-1" accessibilityLiveRegion="polite">
          {state.heading}
        </Heading>
        <Button variant="outline" size="sm" onPress={state.goToday}>
          {t(K.today)}
        </Button>
        <IconButton
          icon="chevron-left"
          label={t(K.previous)}
          variant="ghost"
          size="sm"
          onPress={() => state.move(-1)}
        />
        <IconButton
          icon="chevron-right"
          label={t(K.next)}
          variant="ghost"
          size="sm"
          onPress={() => state.move(1)}
        />
      </View>
      <SegmentedControl
        size="sm"
        isFullWidth
        label={t(K.view)}
        items={SchedulingBoardView.map((view) => ({ id: view, label: t(K[view]) }))}
        selectedKey={state.view}
        onSelectionChange={(key) => state.setView(key as SchedulingBoardView)}
      />
      {draft ? (
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-control)] bg-surface-secondary px-2 py-1">
          <Text type="small" className="font-medium">
            {state.resourceOf(draft.resourceId)?.label ?? ""}
          </Text>
          <Text type="small" tone="muted">
            {draftTime}
          </Text>
          {conflicts.map((conflict) => (
            <Text
              key={conflict.reason}
              type="small"
              tone={conflict.severity === "block" ? "danger" : "warning"}
            >
              {conflict.message ?? conflict.reason}
            </Text>
          ))}
        </View>
      ) : null}
      <View className="overflow-hidden rounded-[var(--radius-container)] border border-separator bg-surface">
        {body}
      </View>
    </View>
  );
}
