/**
 * Stackra file contract:
 * Purpose: `WidgetTile`, one widget on the web: a card with its title and range picker, running its query with its params
 *          and range, refreshed on its events and interval, and drawing its display.
 * Boundary: the answer comes from `useWidgetAnswer` (shared with the native card): `useQuery`, `refreshOn` of an
 *           uncached query and `refreshEvery`. The permission gate is the dashboard's. shortcut: the tile's
 *           picker leaves out `Custom`, which needs a date-range field; a dashboard's own picker carries it.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 14, 17 and 20); ADR 0164 (0294 note: refreshEvery at least 30 seconds); owner decision R-25.
 */
import { useTranslation } from "@stackra/i18n/react";
import { Card, ErrorState, Select, Skeleton } from "@stackra/ui/react";
import { useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { answerFailureOf } from "#core/functions/answer-failure-of.function";
import { TimeRange } from "#core/enums/time-range.enum";
import { WidgetBody } from "#react/widget-body/widget-body";
import { useWidgetAnswer } from "#react/widget-tile/use-widget-answer";
import type { WidgetTileProps } from "#react/widget-tile/widget-tile.props";

/**
 * One widget as a card.
 *
 * @example
 * <WidgetTile widget={widget} actor={{ accountId }} />
 */
export function WidgetTile({ widget, range, actor }: WidgetTileProps): ReactElement {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<TimeRange | undefined>(widget.range);
  const answer = useWidgetAnswer(widget, { actor, range: range ?? picked });
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
          <ErrorState {...answerFailureOf(answer, PANEL_KEYS.panel.widgets, t)} />
        ) : (
          <WidgetBody widget={widget} data={answer.data} isRefreshing={answer.isFetching} />
        )}
      </Card.Content>
    </Card>
  );
}
