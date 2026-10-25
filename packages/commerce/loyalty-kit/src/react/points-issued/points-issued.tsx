/**
 * Stackra file contract:
 * Purpose: `PointsIssued`, the web renderer of the points-issued widget: today's points earned and redeemed on a staff
 *          dashboard.
 * Boundary: a function component on @stackra/ui (free components only), bound to the widget by its name. Presentation
 *           only: the data is the points-issued query's own output. An app shadows this file under
 *           `src/overrides/@stackra/loyalty-kit/src/react/points-issued/points-issued.tsx`, keeping the name and
 *           `PointsIssuedProps`.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 7 and 15); ADR 0165 (UI through @stackra/ui); ADR 0268 (typed i18n keys).
 */
import { useTranslation } from "@stackra/i18n/react";
import { Card, Chip, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { LOYALTY_KIT_KEYS } from "#core/constants/loyalty-kit-keys.constant";
import type { PointsIssuedProps } from "#react/points-issued/points-issued.props";

/**
 * Shows points earned today as the headline and points redeemed as a chip; zeros while loading.
 *
 * @example
 * <PointsIssued data={view} isRefreshing={isFetching} />
 */
export function PointsIssued({ data, isRefreshing }: PointsIssuedProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card aria-busy={isRefreshing}>
      <Card.Header>
        <Card.Title>{t(LOYALTY_KIT_KEYS.loyalty_kit.widgets.points_issued.title)}</Card.Title>
      </Card.Header>
      <Card.Content>
        <Text>{data?.earned ?? 0}</Text>
        <Chip>{`−${data?.redeemed ?? 0}`}</Chip>
      </Card.Content>
    </Card>
  );
}
