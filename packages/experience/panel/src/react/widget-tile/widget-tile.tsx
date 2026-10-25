/**
 * Stackra file contract:
 * Purpose: `WidgetTile`, one widget on the web: a card with its title and range picker, running its query with its params
 *          and range, refreshed on its events and interval, and drawing its display.
 * Boundary: the answer comes from `useQuery` (live when the query declares `invalidateOn`); `refreshOn` of an uncached
 *           query and `refreshEvery` are added here. The permission gate is the dashboard's. shortcut: the tile's
 *           picker leaves out `Custom`, which needs a date-range field; a dashboard's own picker carries it.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 14, 17 and 20); ADR 0164 (0294 note: refreshEvery at least 30 seconds); owner decision R-25.
 */
import { useQuery } from "@stackra/clients/react";
import { useContainer } from "@stackra/container/react";
import { useTranslation } from "@stackra/i18n/react";
import { ServerStateCache } from "@stackra/query";
import { Card, ErrorState, Select, Skeleton } from "@stackra/ui/react";
import { useEffect, useEffectEvent, useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { TimeRange } from "#core/enums/time-range.enum";
import { widgetInput } from "#core/functions/widget-input.function";
import { WidgetBody } from "#react/widget-body/widget-body";
import type { WidgetTileProps } from "#react/widget-tile/widget-tile.props";

/**
 * One widget as a card.
 *
 * @example
 * <WidgetTile widget={widget} actor={{ accountId }} />
 */
export function WidgetTile({ widget, range, actor }: WidgetTileProps): ReactElement {
  const { t } = useTranslation();
  const container = useContainer();
  const [picked, setPicked] = useState<TimeRange | undefined>(widget.range);
  const active = range ?? picked;
  const answer = useQuery(
    widget.query,
    widgetInput(widget, {
      ...(actor === undefined ? {} : { actor }),
      ...(active === undefined ? {} : { range: active }),
    }),
  );
  const refetch = useEffectEvent(() => {
    void answer.refetch();
  });
  useEffect(() => {
    if (widget.refreshOn.length === 0 || !container.has(ServerStateCache)) return;
    return container
      .get(ServerStateCache)
      .watch({ key: widget.query.key, invalidateOn: widget.refreshOn });
  }, [container, widget.query.key, widget.refreshOn]);
  useEffect(() => {
    if (widget.refreshEveryMs === undefined) return;
    const timer = setInterval(() => refetch(), widget.refreshEveryMs);
    return () => clearInterval(timer);
  }, [widget.refreshEveryMs]);
  const choices = widget.ranges.filter((code) => code !== TimeRange.Custom);
  return (
    <Card aria-busy={answer.isFetching}>
      <Card.Header>
        <Card.Title>{t(widget.title)}</Card.Title>
        {range === undefined && choices.length > 1 && (
          <Select
            label={t(PANEL_KEYS.panel.widgets.range)}
            items={choices.map((code) => ({
              id: code,
              label: t(PANEL_KEYS.panel.time_range[code]),
            }))}
            value={picked ?? null}
            onChange={(code) => setPicked((code as TimeRange | null) ?? widget.range)}
          />
        )}
      </Card.Header>
      <Card.Content>
        {answer.isPending ? (
          <Skeleton />
        ) : answer.error ? (
          <ErrorState
            title={t(PANEL_KEYS.panel.widgets.failed)}
            error={answer.error}
            retry={{
              label: t(PANEL_KEYS.panel.widgets.retry),
              onPress: () => void answer.refetch(),
            }}
          />
        ) : (
          <WidgetBody widget={widget} data={answer.data} isRefreshing={answer.isFetching} />
        )}
      </Card.Content>
    </Card>
  );
}
