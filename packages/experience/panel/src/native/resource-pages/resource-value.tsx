/**
 * Stackra file contract:
 * Purpose: the native `ResourceValue`, one value of a resource row or record as `Text`, as on the web: money in its
 *          currency, a list as its length (`count`), a money object (`{ minor, currency }`) in its currency, a principal
 *          by its name, a flag as a localised yes or no, an enum code by its label, a date, or the value as typed.
 * Boundary: internal to the native resource pages; reads the value and, for money, the currency beside it. React
 *           Native draws a string only inside `Text`, so every value is one. An enum code takes its label
 *           (`useResourceValueText`, the web pages' platform-free hook), else shows as its code.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164; ADR 0294 decision 22 (derived enum labels).
 */
import { Text } from "@stackra/ui/native";
import type { ReactElement } from "react";

import type { ResourceValueProps } from "#react/resource-pages/resource-value.props";
import { useResourceValueText } from "#react/resource-pages/use-resource-value-text";

/**
 * One value, formatted for its column or entry kind.
 *
 * @example
 * <ResourceValue resourceKey="orders.order" path="totals.totalMinor" kind="money" value={row.totals.totalMinor}
 *   currency={row.totals.currency} />
 */
export function ResourceValue(props: ResourceValueProps): ReactElement {
  return <Text>{useResourceValueText(props)}</Text>;
}
