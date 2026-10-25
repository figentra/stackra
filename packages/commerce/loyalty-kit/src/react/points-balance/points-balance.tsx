/**
 * Stackra file contract:
 * Purpose: `PointsBalance`, the web renderer of the points-balance widget: balance, tier and the expiry warning on a
 *          member's "My points" dashboard.
 * Boundary: a function component on @stackra/ui (free components only), bound to the widget by its name. No business
 *           logic: the warning rule is `isExpiringSoon` in core, shared with the native renderer; the time is read
 *           once at mount, so a thirty-day window needs no ticking clock. An app shadows this file under
 *           `src/overrides/@stackra/loyalty-kit/src/react/points-balance/points-balance.tsx`, keeping the name and
 *           `PointsBalanceProps`.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 7 and 15); ADR 0165 (UI through @stackra/ui); ADR 0268 (typed i18n keys).
 */
import { useTranslation } from "@stackra/i18n/react";
import { Card, Chip, Text } from "@stackra/ui/react";
import { type ReactElement, useState } from "react";

import { LOYALTY_KIT_KEYS } from "#core/constants/loyalty-kit-keys.constant";
import { isExpiringSoon } from "#core/functions/is-expiring-soon.function";
import type { PointsBalanceProps } from "#react/points-balance/points-balance.props";

/** The kit's keys. */
const KEYS = LOYALTY_KIT_KEYS.loyalty_kit;

/**
 * Shows the balance with the tier as a chip, and a warning when points expire within thirty days.
 *
 * @example
 * <PointsBalance data={balance} isRefreshing={isFetching} />
 */
export function PointsBalance({ data, isRefreshing }: PointsBalanceProps): ReactElement {
  const [now] = useState(() => Date.now());
  const { t } = useTranslation();
  return (
    <Card aria-busy={isRefreshing}>
      <Card.Header>
        <Card.Title>{t(KEYS.widgets.points_balance.title)}</Card.Title>
      </Card.Header>
      <Card.Content>
        <Text>{data?.balance ?? 0}</Text>
        {data && <Chip>{t(KEYS.enums.loyalty_tier[data.tier])}</Chip>}
        {isExpiringSoon(data?.nextExpiryAt, now) && (
          <Text tone="warning">{t(KEYS.widgets.points_balance.expiry_note)}</Text>
        )}
      </Card.Content>
    </Card>
  );
}
