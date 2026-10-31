/**
 * Stackra file contract:
 * Purpose: the web `Kpi`: a `Stat` (trend, sparkline, target and drill-down included) on its own card, with an
 *          optional icon in a soft tile at the start.
 * Boundary: composition only; the figure's formatting is `Stat`'s.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 15 and 18); STA-1371.
 */
import type { ReactElement } from "react";

import { Card } from "#react/card/card";
import { Icon } from "#react/icon/icon";
import type { KpiProps } from "#react/kpi/kpi.props";
import { Stat } from "#react/stat/stat";

/** A key performance indicator tile. */
export function Kpi({ icon, className, ...stat }: KpiProps): ReactElement {
  return (
    // A block, not the card's flex column: its one child is a size container, and a flex item that is one is laid out
    // again for each of the column's measuring passes, nested Stat container and all, which stalled pages of KPIs
    // for seconds.
    <Card className={["block min-w-0", className].filter(Boolean).join(" ")}>
      {/* A narrow tile puts the icon above the figure, so the figure keeps the tile's whole width. */}
      <div className="@container">
        <div className="flex flex-col gap-3 @[13rem]:flex-row @[13rem]:items-start">
          {icon ? (
            <span
              aria-hidden
              className="flex size-(--size-icon-tile) shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent-soft text-accent"
            >
              <Icon name={icon} size="sm" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <Stat {...stat} />
          </div>
        </div>
      </div>
    </Card>
  );
}
