/**
 * Stackra file contract:
 * Purpose: the native `Scheduler`: an event calendar in day, week, month and agenda views. A header holds the period's
 *          heading, Today, previous and next, and the view as a segmented control; the body is the time grid (day,
 *          week), the month grid or the agenda list. Events are placed by time in `timeZone`; overlapping ones share
 *          the width; a press on an event, an empty hour or a date reaches the caller or opens that day.
 * Boundary: shows events, never edits them (no drag). Words are `ui::scheduler.*`; dates are in the customer's digits.
 *           Rows and arrows follow the platform direction. Colours, radii and spacing are tokens.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.8 and 4.1.2; STA-1371 (gap
 *          build, owner approval 2026-10-31).
 */
import { useNumerals } from "@stackra/i18n/react";
import { use, type ReactElement } from "react";
import { View } from "react-native";

import { SchedulerView } from "#contracts/enums/scheduler-view.enum";
import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { useSchedulerState } from "#react/hooks/use-scheduler-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { Heading } from "#native/heading/heading";
import { IconButton } from "#native/icon-button/icon-button";
import { SchedulerAgenda } from "#native/scheduler/scheduler-agenda";
import { SchedulerMonth } from "#native/scheduler/scheduler-month";
import { SchedulerTimeGrid } from "#native/scheduler/scheduler-time-grid";
import type { SchedulerProps } from "#native/scheduler/scheduler.props";
import { SegmentedControl } from "#native/segmented-control/segmented-control";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

/** An event calendar. */
export function Scheduler({ className, ...props }: SchedulerProps): ReactElement {
  const t = useUiText();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const state = useSchedulerState(props, locale, useNumerals());
  const body = {
    state,
    locale,
    events: props.events,
    onEventPress: props.onEventPress,
    onSlotPress: props.onSlotPress,
  };
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
        items={SchedulerView.map((view) => ({ id: view, label: t(K[view]) }))}
        selectedKey={state.view}
        onSelectionChange={(key) => state.setView(key as SchedulerView)}
      />
      <View className="overflow-hidden rounded-[var(--radius-container)] border border-separator bg-surface">
        {state.view === "month" ? (
          <SchedulerMonth {...body} />
        ) : state.view === "agenda" ? (
          <SchedulerAgenda {...body} />
        ) : (
          <SchedulerTimeGrid {...body} />
        )}
      </View>
    </View>
  );
}
