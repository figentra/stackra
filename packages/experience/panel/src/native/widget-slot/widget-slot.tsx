/**
 * Stackra file contract:
 * Purpose: `WidgetSlot`, a slot's widgets on native: every registered widget placed in the slot that the session may read,
 *          `columns` to a row, each a card running its query and drawing its built-in display natively.
 * Boundary: layers 1 to 3 (and 2b) are resolved from the registered table; the permission gate reads the container's
 *           `ClientSession` (every widget shows without one, and the run still decides). Refresh follows the query's
 *           `invalidateOn` through `useQuery`, plus an uncached widget's `refreshOn` and `refreshEvery`.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 14, 17 to 19); ADR 0306 (rules 7 and 8); ADR 0164.
 */
import { ClientSession } from "@stackra/clients/contracts";
import { useContainer } from "@stackra/container/react";
import type { ReactElement } from "react";
import { View } from "react-native";

import { widgetsFor } from "#core/functions/widgets-for.function";
import { WidgetCard } from "#native/widget-card/widget-card";
import type { WidgetSlotProps } from "#native/widget-slot/widget-slot.props";

/**
 * The widgets of `slot`, `columns` to a row.
 *
 * @throws RangeError when `columns` is not a whole number from 1 to 4.
 * @example
 * <WidgetSlot slot={Slots.Dashboard.Header} columns={2} />
 */
export function WidgetSlot({
  slot,
  columns = 1,
  range,
  actor,
}: WidgetSlotProps): ReactElement | null {
  const container = useContainer();
  const session = container.has(ClientSession) ? container.get(ClientSession) : undefined;
  if (!Number.isInteger(columns) || columns < 1 || columns > 4)
    throw new RangeError(`WidgetSlot columns is a whole number from 1 to 4, got ${columns}`);
  const widgets = widgetsFor([slot]).filter(
    (widget) => widget.permission === undefined || session?.can(widget.permission) !== false,
  );
  if (widgets.length === 0) return null;
  const rows = Array.from({ length: Math.ceil(widgets.length / columns) }, (_, row) =>
    widgets.slice(row * columns, row * columns + columns),
  );
  return (
    <View className="gap-3" testID={`widget-slot-${slot.key}`}>
      {rows.map((row) => (
        <View key={row.map((widget) => widget.key).join("|")} className="flex-row gap-3">
          {row.map((widget) => (
            <View key={widget.key} className="flex-1">
              <WidgetCard
                widget={widget}
                {...(range === undefined ? {} : { range })}
                {...(actor === undefined ? {} : { actor })}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
