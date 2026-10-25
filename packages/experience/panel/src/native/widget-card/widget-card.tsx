/**
 * Stackra file contract:
 * Purpose: `WidgetCard`, one widget on native: a card with its title, running its query with its params and range,
 *          refreshed on its events and interval, and drawing its display.
 * Boundary: internal to the `./native` entry. Native tiles take the slot's range or the widget's default; the range picker
 *           is the web tile's.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 14, 17 and 20); ADR 0164 (0294 note); owner decision R-25.
 */
import { useQuery } from "@stackra/clients/react";
import { useContainer } from "@stackra/container/react";
import { useTranslation } from "@stackra/i18n/react";
import { ServerStateCache } from "@stackra/query";
import { Card, ErrorState, Skeleton } from "@stackra/ui/native";
import { useEffect, useEffectEvent, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { widgetInput } from "#core/functions/widget-input.function";
import type { WidgetCardProps } from "#native/widget-card/widget-card.props";
import { WidgetContent } from "#native/widget-content/widget-content";

/**
 * One widget as a native card.
 *
 * @example
 * <WidgetCard widget={widget} />
 */
export function WidgetCard({ widget, range, actor }: WidgetCardProps): ReactElement {
  const { t } = useTranslation();
  const container = useContainer();
  const answer = useQuery(
    widget.query,
    widgetInput(widget, {
      ...(actor === undefined ? {} : { actor }),
      ...(range === undefined ? {} : { range }),
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
  return (
    <Card>
      <Card.Header>
        <Card.Title>{t(widget.title)}</Card.Title>
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
          <WidgetContent widget={widget} data={answer.data} isRefreshing={answer.isFetching} />
        )}
      </Card.Content>
    </Card>
  );
}
