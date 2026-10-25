/**
 * Stackra file contract:
 * Purpose: `Dashboard`, the panel's widget grid on the web: every registered widget placed in the given slots that the
 *          session may read, a Band as one row of KPI tiles, a Grid on 12 columns by each widget's size.
 * Boundary: layers 1 to 3 (and 2b) are resolved from the registered table; the permission gate reads the container's
 *           `ClientSession` (every widget shows without one, and the run still decides). shortcut: `overridable` is
 *           accepted but no layer 4 or 5 layout is read yet, because the experience service's layout query is not
 *           built; the code layout shows. Roles shape no default yet, so every permitted widget shows.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 14, 18 to 20); ADR 0306 (rules 7 and 8); ADR 0273 (roles shape presentation only).
 */
import { ClientSession } from "@stackra/clients/contracts";
import { useContainer } from "@stackra/container/react";
import { Enum } from "@stackra/contracts";
import type { ReactElement } from "react";

import { Place } from "#core/enums/place.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";
import { widgetsFor } from "#core/functions/widgets-for.function";
import type { DashboardProps } from "#react/dashboard/dashboard.props";
import { WidgetTile } from "#react/widget-tile/widget-tile";

/** The grid span class of each column count; written out so the style scanner keeps them. */
const SPAN: Readonly<Record<number, string>> = Object.freeze({
  3: "lg:col-span-3",
  6: "lg:col-span-6",
  9: "lg:col-span-9",
  12: "lg:col-span-12",
});

/**
 * The widgets of `slots`.
 *
 * @example
 * <Dashboard panel={Panels.Admin} slots={[Slots.Dashboard.Main]} overridable />
 */
export function Dashboard({ panel, slots, range, actor }: DashboardProps): ReactElement {
  const container = useContainer();
  const session = container.has(ClientSession) ? container.get(ClientSession) : undefined;
  return (
    <div className="flex flex-col gap-6" data-panel={panel.key}>
      {slots.map((slot) => {
        const widgets = widgetsFor([slot]).filter(
          (widget) => widget.permission === undefined || session?.can(widget.permission) !== false,
        );
        if (widgets.length === 0) return null;
        const isBand = slot.place === Place.Band;
        return (
          <section
            key={slot.key}
            data-slot={slot.key}
            className={
              isBand ? "grid gap-4 sm:grid-flow-col sm:auto-cols-fr" : "grid gap-4 lg:grid-cols-12"
            }
          >
            {widgets.map((widget) => (
              <div
                key={widget.key}
                className={isBand ? undefined : SPAN[Enum.meta(WidgetSize, widget.size).columns]}
              >
                <WidgetTile
                  widget={widget}
                  {...(range === undefined ? {} : { range })}
                  {...(actor === undefined ? {} : { actor })}
                />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
