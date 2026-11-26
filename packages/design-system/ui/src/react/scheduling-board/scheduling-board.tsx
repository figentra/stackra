/**
 * Stackra file contract:
 * Purpose: the web `SchedulingBoard`: resources down the side and time across, in day, week or timeline views. A
 *          header holds the span's heading, Today, previous and next, and the view as a segmented control; the grid
 *          shows each row's bookings, holds and blocks, its closures, working time and the past shaded, and lets a
 *          range be selected, an item moved across time and rows or resized, by pointer or keyboard, with a preview
 *          and its conflicts while dragging. A live region says what happened. A skeleton shows while loading.
 * Boundary: a pure view: it never fetches or writes and never refuses a drop; `onSelectRange`, `onItemChange` and
 *           `onItemPress` reach the screen, and a moved item is held where it was dropped only while the screen's
 *           promise is open (`useSchedulingBoardState`). Words are `ui::scheduling_board.*`; dates in the customer's
 *           digits and calendar. The grid follows the reading direction. Colours, radii and spacing are tokens.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); ADR 0508 (shortcuts); WCAG 2.2 SC 1.3.1,
 *          2.1.1, 2.5.7, 4.1.2 and 4.1.3; shared modules step 4a (LEADER, 2026-11-09).
 */
import { getLocalTimeZone } from "@internationalized/date";
import { cn } from "@heroui/react";
import { useNumerals } from "@stackra/i18n/react";
import { STANDARD_SHORTCUTS } from "@stackra/shortcuts";
import { use, type ReactElement } from "react";

import { SchedulingBoardView } from "#contracts/enums/scheduling-board-view.enum";
import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import { Button } from "#react/button/button";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { Heading } from "#react/heading/heading";
import { useSchedulingBoardState } from "#react/hooks/use-scheduling-board-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { SchedulingBoardGrid } from "#react/scheduling-board/scheduling-board-grid";
import type { SchedulingBoardProps } from "#react/scheduling-board/scheduling-board.props";
import { SegmentedControl } from "#react/segmented-control/segmented-control";
import { Skeleton } from "#react/skeleton/skeleton";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** The skeleton's rows. */
const BONES = ["a", "b", "c", "d"] as const;

/** A scheduling board of resources over time. */
export function SchedulingBoard({ className, ...props }: SchedulingBoardProps): ReactElement {
  const t = useUiText();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const state = useSchedulingBoardState(props, locale, useNumerals());
  const selectable = !state.readOnly && props.onSelectRange !== undefined;
  const body =
    props.isLoading === true ? (
      <div aria-busy="true" className="flex flex-col gap-2 p-3">
        <span className="sr-only">{t(K.loading)}</span>
        {BONES.map((bone) => (
          <Skeleton
            key={bone}
            aria-hidden="true"
            className="h-10 w-full rounded-[var(--radius-control)]"
          />
        ))}
      </div>
    ) : props.resources.length === 0 ? (
      <p className="p-6 text-center text-sm text-muted">{t(K.empty)}</p>
    ) : (
      <SchedulingBoardGrid
        state={state}
        label={props.label}
        timeZone={props.timeZone ?? getLocalTimeZone()}
        locale={locale}
        selectable={selectable}
        onItemPress={props.onItemPress}
        renderItem={props.renderItem}
      />
    );
  return (
    <section
      aria-label={props.label}
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Heading level={2} type="h4" className="me-auto" aria-live="polite">
          {state.heading}
        </Heading>
        {/* Shortcuts (ADR 0508): T today, Mod+Left and Right the span, mirrored right to left. */}
        <Button
          variant="outline"
          size="sm"
          onPress={state.goToday}
          shortcut={STANDARD_SHORTCUTS["calendar.today"]}
          shortcutId="calendar.today"
        >
          {t(K.today)}
        </Button>
        <IconButton
          icon="chevron-left"
          label={t(K.previous)}
          variant="ghost"
          size="sm"
          action={{
            id: "calendar.previous",
            label: t(K.previous),
            shortcut: STANDARD_SHORTCUTS["calendar.previous"],
            isDirectional: true,
            run: () => state.move(-1),
          }}
        />
        <IconButton
          icon="chevron-right"
          label={t(K.next)}
          variant="ghost"
          size="sm"
          action={{
            id: "calendar.next",
            label: t(K.next),
            shortcut: STANDARD_SHORTCUTS["calendar.next"],
            isDirectional: true,
            run: () => state.move(1),
          }}
        />
        <SegmentedControl
          size="sm"
          label={t(K.view)}
          items={SchedulingBoardView.map((view) => ({ id: view, label: t(K[view]) }))}
          selectedKey={state.view}
          onSelectionChange={(key) => state.setView(key as SchedulingBoardView)}
        />
      </div>
      <div className="overflow-hidden rounded-[var(--radius-container)] border border-separator bg-surface">
        {body}
      </div>
      <div role="status" className="sr-only">
        {state.announcement}
      </div>
    </section>
  );
}
