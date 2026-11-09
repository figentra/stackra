/**
 * Stackra file contract:
 * Purpose: `KpiView`, one KPI on the web: the label, the value formatted from its metric type (money in its currency, a
 *          percent metric as a percent, a count as a number), the note line under it, the change against the previous
 *          period coloured by the better direction, the threshold tone and the target.
 * Boundary: internal to the `./react` entry; the words are `useKpi`, shared with native; computes nothing the metric does
 *           not carry beyond the change. shortcut: the drill-down and the sparkline are not drawn yet (the route of a
 *           resource class and a free chart component are still to come); the KPI shows the series' numbers only
 *           through its value.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 15); ADR 0220 (money in minor units).
 */
import { Chip, Icon, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { KpiViewProps } from "#react/kpi-view/kpi-view.props";
import { useKpi } from "#react/kpi-view/use-kpi";

/**
 * Draws one KPI with its note, change, tone and target.
 *
 * @example
 * <KpiView widget={widget} kpi={kpi} metric={answer.spend} note={answer.spendOtherCurrencies} />
 */
export function KpiView(props: KpiViewProps): ReactElement {
  const { label, note, value, tone, change, target } = useKpi(props);
  const noteLine = note !== undefined && (
    <Text type="small" tone="muted">
      {note}
    </Text>
  );
  if (value === undefined)
    return (
      <div className="flex flex-col gap-1">
        <Text tone="muted">{label}</Text>
        <Text>{"—"}</Text>
        {noteLine}
      </div>
    );
  const icon = props.kpi.icon;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {icon !== undefined && <Icon name={icon} aria-hidden />}
        <Text tone="muted">{label}</Text>
      </div>
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
    </div>
  );
}
