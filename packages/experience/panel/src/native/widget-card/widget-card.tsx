/**
 * Stackra file contract:
 * Purpose: `WidgetCard`, one widget on native: a card with its title, running its query with its params and range,
 *          refreshed on its events and interval, and drawing its display.
 * Boundary: internal to the `./native` entry. Native tiles take the slot's range or the widget's default; the range picker
 *           is the web tile's. The answer is the web tile's platform-free `useWidgetAnswer`.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 14, 17 and 20); ADR 0164 (0294 note); owner decision R-25.
 */
import { useTranslation } from "@stackra/i18n/react";
import { Card, ErrorState, Skeleton } from "@stackra/ui/native";
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { answerFailureOf } from "#core/functions/answer-failure-of.function";
import type { WidgetCardProps } from "#native/widget-card/widget-card.props";
import { WidgetContent } from "#native/widget-content/widget-content";
import { useWidgetAnswer } from "#react/widget-tile/use-widget-answer";

/**
 * One widget as a native card.
 *
 * @example
 * <WidgetCard widget={widget} />
 */
export function WidgetCard({ widget, range, actor }: WidgetCardProps): ReactElement {
  const { t } = useTranslation();
  const answer = useWidgetAnswer(widget, { actor, range });
  return (
    <Card>
      <Card.Header>
        <Card.Title>{t(widget.title)}</Card.Title>
      </Card.Header>
      <Card.Content>
        {answer.isPending ? (
          <Skeleton />
        ) : answer.error ? (
          <ErrorState {...answerFailureOf(answer, PANEL_KEYS.panel.widgets, t)} />
        ) : (
          <WidgetContent widget={widget} data={answer.data} isRefreshing={answer.isFetching} />
        )}
      </Card.Content>
    </Card>
  );
}
