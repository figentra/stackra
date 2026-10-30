/**
 * Stackra file contract:
 * Purpose: the native `KpiGroup`: a band of KPIs on one card, two to a row and wrapping, named for assistive
 *          technology.
 * Boundary: layout only; rows follow the reading direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decision 18); STA-1371.
 */
import { Children, type ReactElement } from "react";
import { View } from "react-native";

import { Card } from "#native/card/card";
import type { KpiGroupProps } from "#native/kpi-group/kpi-group.props";

/** A band of KPIs. */
export function KpiGroup({ children, label, className }: KpiGroupProps): ReactElement {
  return (
    <Card
      accessibilityLabel={label}
      className={["flex-row flex-wrap gap-y-4", className].filter(Boolean).join(" ")}
    >
      {Children.toArray(children).map((child, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- the wrapped children have no identity but their place in the group
        <View key={index} className="w-1/2 px-2">
          {child}
        </View>
      ))}
    </Card>
  );
}
