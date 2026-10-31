/**
 * Stackra file contract:
 * Purpose: the web `Scheduler`: an event calendar in day, week, month and agenda views. A header holds the period's
 *          heading, Today, previous and next, and the view as a segmented control; the body is the time grid (day,
 *          week), the month table or the agenda list. Events are placed by time in `timeZone`; overlapping ones share
 *          the width; a press on an event, an empty hour or a date reaches the caller or opens that day.
 * Boundary: shows events, never edits them (no drag yet). Words are `ui::scheduler.*`; dates are in the customer's
 *           digits. Columns and arrows follow the reading direction. Colours, radii and spacing are tokens.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6 and 4.1.2; STA-1371
 *          (gap build, owner approval 2026-10-31).
 */
import { cn } from "@heroui/react";
import { useNumerals } from "@stackra/i18n/react";
import { use, type ReactElement } from "react";

import { SchedulerView } from "#contracts/enums/scheduler-view.enum";
import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { Button } from "#react/button/button";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { Heading } from "#react/heading/heading";
import { useSchedulerState } from "#react/hooks/use-scheduler-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { SchedulerAgenda } from "#react/scheduler/scheduler-agenda";
import { SchedulerMonth } from "#react/scheduler/scheduler-month";
import { SchedulerTimeGrid } from "#react/scheduler/scheduler-time-grid";
import type { SchedulerProps } from "#react/scheduler/scheduler.props";
import { SegmentedControl } from "#react/segmented-control/segmented-control";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

/** An event calendar. */
export function Scheduler({ className, ...props }: SchedulerProps): ReactElement {
  const t = useUiText();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const state = useSchedulerState(props, locale, useNumerals());
  const body = {
    state,
    events: props.events,
    onEventPress: props.onEventPress,
    onSlotPress: props.onSlotPress,
  };
  return (
    <section
      aria-label={props.label}
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Heading level={2} type="h4" className="me-auto" aria-live="polite">
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
        <SegmentedControl
          size="sm"
          label={t(K.view)}
          items={SchedulerView.map((view) => ({ id: view, label: t(K[view]) }))}
          selectedKey={state.view}
          onSelectionChange={(key) => state.setView(key as SchedulerView)}
        />
      </div>
      <div className="overflow-hidden rounded-[var(--radius-container)] border border-separator bg-surface">
        {state.view === "month" ? (
          <SchedulerMonth {...body} />
        ) : state.view === "agenda" ? (
          <SchedulerAgenda {...body} />
        ) : (
          <SchedulerTimeGrid {...body} />
        )}
      </div>
    </section>
  );
}
