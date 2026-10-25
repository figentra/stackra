/**
 * Stackra file contract:
 * Purpose: the native `Stat`: one headline figure with its label above and an optional badge beside it, for a card
 *          or a widget (`<Stat label="Points" value={1200} badge="Gold" />`), drawn with the design system's `Text` and
 *          `Chip`, the same props as on web.
 * Boundary: no HeroUI Native component of its own (HeroUI Native has no stat); the label is read before the figure. A
 *           number is formatted in the `DesignSystemProvider`'s locale, or the device's without one.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); owner decision 6 of STA-350 (thin wrappers).
 */
import { type ReactElement, use } from "react";
import { View } from "react-native";

import type { StatContractProps } from "#contracts/types/stat-contract-props.type";
import { Chip } from "#native/chip/chip";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { Text } from "#native/text/text";

/** Props of the native Stat: the shared contract. */
export type StatProps = StatContractProps;

/** A labelled headline figure. */
export function Stat({ label, value, badge }: StatProps): ReactElement {
  const locale = use(DesignSystemContext)?.locale;
  const figure = typeof value === "number" ? new Intl.NumberFormat(locale).format(value) : value;
  return (
    <View className="gap-1">
      <Text type="small" tone="muted">
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-3xl font-semibold">{figure}</Text>
        {badge ? <Chip size="sm">{badge}</Chip> : null}
      </View>
    </View>
  );
}
