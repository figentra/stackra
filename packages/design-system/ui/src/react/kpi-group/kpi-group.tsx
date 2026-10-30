/**
 * Stackra file contract:
 * Purpose: the web `KpiGroup`: a dashboard band of KPIs on one card, side by side with dividers once the card itself is
 *          36rem wide (a container query, so a narrow column or preview keeps two to a row), named as a group.
 * Boundary: layout only; dividers use logical borders, so the band reads the same in Arabic.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 18: the Band place); STA-1371.
 */
import { cn } from "@heroui/react";
import { Children, type ReactElement } from "react";

import { Card } from "#react/card/card";
import type { KpiGroupProps } from "#react/kpi-group/kpi-group.props";

/** A band of KPIs. */
export function KpiGroup({ children, label, className }: KpiGroupProps): ReactElement {
  return (
    <Card role="group" aria-label={label} className={["p-0", className].filter(Boolean).join(" ")}>
      <div className="@container">
        <div className="grid grid-cols-2 gap-y-4 py-4 @xl:auto-cols-fr @xl:grid-flow-col @xl:grid-cols-none">
          {Children.map(Children.toArray(children), (child, index) => (
            <div className={cn("min-w-0 px-4", index > 0 && "@xl:border-s @xl:border-separator")}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
