/**
 * Stackra file contract:
 * Purpose: `WidgetBody`, a widget's display on the web: a KPI, a KPI group, a progress bar against the target, the rows of a
 *          list, or the Custom renderer with the answer.
 * Boundary: internal to the `./react` entry; the display is `useWidgetDisplay`, shared with native; presents the
 *           answer and computes nothing beyond the change ratio the metric type implies. shortcut: a View display shows the "not shown here" state, because the resource table
 *           renderer is not built yet; it renders the resource's view once that lands.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 14 and 15); ADR 0164 (0294 note: only Custom takes a renderer); ADR 0305 (rule 31).
 */
import { EmptyState, List, ProgressBar } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { KpiView } from "#react/kpi-view/kpi-view";
import { useWidgetDisplay } from "#react/widget-body/use-widget-display";
import type { WidgetBodyProps } from "#react/widget-body/widget-body.props";

/**
 * The display of `widget` over `data`.
 *
 * @example
 * <WidgetBody widget={widget} data={answer.data} isRefreshing={answer.isFetching} />
 */
export function WidgetBody(props: WidgetBodyProps): ReactElement {
  const display = useWidgetDisplay(props);
  switch (display.kind) {
    case "kpis": {
      const kpis = display.kpis.map(({ kpi, metric, note }) => (
        <KpiView key={kpi.path} widget={props.widget} kpi={kpi} metric={metric} note={note} />
      ));
      return display.isGroup ? (
        <div className="grid gap-4 sm:grid-cols-2">{kpis}</div>
      ) : (
        <>{kpis}</>
      );
    }
    case "progress": {
      return <ProgressBar label={display.label} isLabelVisible {...display.progress} />;
    }
    case "list": {
      return (
        <List
          label={display.label}
          items={display.items.map(({ meta, ...item }) =>
            meta === undefined ? item : { ...item, endContent: meta },
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
