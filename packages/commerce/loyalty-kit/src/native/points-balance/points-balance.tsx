/**
 * Stackra file contract:
 * Purpose: `PointsBalance`, the native renderer of the points-balance widget: balance, tier and the expiry warning on
 *          the mobile app's "My points" screen.
 * Boundary: a function component on @stackra/ui/native, the native implementation of the same Card, Chip and Text
 *           contract the web renderer uses. It mirrors the web component and shares only core: the warning rule
 *           (`isExpiringSoon`), the keys and the data shape. The card announces itself busy to screen readers while the
 *           host refreshes it. An app shadows it under
 *           `src/overrides/@stackra/loyalty-kit/src/native/points-balance/points-balance.tsx`.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decisions 7 and 15); ADR 0165 (native UI through @stackra/ui/native); ADR 0302; ADR
 *                     0268 (typed i18n keys).
 */
import { useTranslation } from "@stackra/i18n/react";
import { Card, Chip, Text } from "@stackra/ui/native";
import { type ReactElement, useState } from "react";

import { LOYALTY_KIT_KEYS } from "#core/constants/loyalty-kit-keys.constant";
import { isExpiringSoon } from "#core/functions/is-expiring-soon.function";
import type { PointsBalanceProps } from "#native/points-balance/points-balance.props";

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
    <Card accessibilityState={{ busy: isRefreshing }}>
      <Card.Header>
        <Card.Title>{t(KEYS.widgets.points_balance.title)}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-2">
        <Text>{String(data?.balance ?? 0)}</Text>
        {data && <Chip>{t(KEYS.enums.loyalty_tier[data.tier])}</Chip>}
        {isExpiringSoon(data?.nextExpiryAt, now) && (
          <Text tone="warning">{t(KEYS.widgets.points_balance.expiry_note)}</Text>
        )}
      </Card.Content>
    </Card>
  );
}
