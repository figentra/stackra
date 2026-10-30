/**
 * Stackra file contract:
 * Purpose: the native `Kpi`: a `Stat` (trend, sparkline, target and drill-down included) on its own card, with an
 *          optional icon in a soft tile at the start.
 * Boundary: composition only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decisions 15 and 18); STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { Card } from "#native/card/card";
import { Icon } from "#native/icon/icon";
import type { KpiProps } from "#native/kpi/kpi.props";
import { Stat } from "#native/stat/stat";

/** A key performance indicator tile. */
export function Kpi({ icon, className, ...stat }: KpiProps): ReactElement {
  return (
    <Card className={["flex-row items-start gap-3", className].filter(Boolean).join(" ")}>
      {icon ? (
        <View
          className="size-9 items-center justify-center rounded-lg bg-accent-soft"
          importantForAccessibility="no-hide-descendants"
        >
          <Icon name={icon} size="sm" tone="accent" />
        </View>
      ) : null}
      <View className="flex-1">
        <Stat {...stat} />
      </View>
    </Card>
  );
}
