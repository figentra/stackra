/**
 * Stackra file contract:
 * Purpose: `WidgetContent`, a widget's display on native: a KPI or a KPI group (value from the metric type, change against
 *          the previous period, threshold tone, target, note line), a progress bar, the rows of a list, or the Custom
 *          renderer.
 * Boundary: internal to the `./native` entry; the display and each KPI's words are the web's platform-free
 *           `useWidgetDisplay` and `useKpi`; presents the answer and computes nothing beyond the change ratio. shortcut:
 *           a View display shows the "not shown here" state until the resource table renderer is built.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 14 and 15); ADR 0164 (0294 note); ADR 0220 (money in minor units).
 */
import { Chip, EmptyState, List, ProgressBar, Text } from "@stackra/ui/native";
import type { ReactElement } from "react";
import { View } from "react-native";

import type { WidgetContentProps } from "#native/widget-content/widget-content.props";
import type { KpiViewProps } from "#react/kpi-view/kpi-view.props";
import { useKpi } from "#react/kpi-view/use-kpi";
import { useWidgetDisplay } from "#react/widget-body/use-widget-display";

/** One KPI of `widget` over `metric`. */
function Kpi(props: KpiViewProps): ReactElement {
  const { label, note, value, tone, change, target } = useKpi(props);
  const noteLine = note !== undefined && (
    <Text type="small" tone="muted">
      {note}
    </Text>
  );
  if (value === undefined)
    return (
      <View className="flex-1 gap-1">
        <Text tone="muted">{label}</Text>
        <Text>{"—"}</Text>
        {noteLine}
      </View>
    );
  return (
    <View className="flex-1 gap-1">
      <Text tone="muted">{label}</Text>
      <Text tone={tone ?? "default"}>{value}</Text>
      {noteLine}
      {change !== undefined && (
        <Chip size="sm" tone={change.tone}>
          {change.text}
        </Chip>
      )}
      {target !== undefined && (
        <Text type="small" tone="muted">
          {target}
        </Text>
      )}
    </View>
  );
}

/**
 * The display of `widget` over `data`.
 *
 * @example
 * <WidgetContent widget={widget} data={answer.data} isRefreshing={answer.isFetching} />
 */
export function WidgetContent(props: WidgetContentProps): ReactElement {
  const display = useWidgetDisplay(props);
  switch (display.kind) {
    case "kpis": {
      const kpis = display.kpis.map(({ kpi, metric, note }) => (
        <Kpi key={kpi.path} widget={props.widget} kpi={kpi} metric={metric} note={note} />
      ));
      return display.isGroup ? <View className="flex-row gap-3">{kpis}</View> : <>{kpis}</>;
    }
    case "progress": {
      return <ProgressBar label={display.label} isLabelVisible {...display.progress} />;
    }
    case "list": {
      return (
        <List
          label={display.label}
          items={display.items.map(({ meta, ...item }) =>
            meta === undefined ? item : { ...item, endContent: <Text>{meta}</Text> },
          )}
          emptyState={<EmptyState title={display.emptyTitle} />}
        />
      );
    }
    case "custom": {
      return display.element;
    }
    default: {
      return <EmptyState title={display.title} />;
    }
  }
}
