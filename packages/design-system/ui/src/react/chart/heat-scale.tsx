/**
 * Stackra file contract:
 * Purpose: `HeatScale`, the "Less ▢▢▢▢▢ More" key under a web heatmap or calendar heatmap.
 * Boundary: decorative for assistive technology (the data table carries the values); laid out with flex, so it
 *           follows the reading direction.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ReactElement } from "react";

import type { ChartColor } from "#contracts/enums/chart-color.enum";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { heatShadeOf } from "#react/chart/heat-shade-of.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The five shades between "Less" and "More". */
export function HeatScale({ color }: { readonly color: ChartColor }): ReactElement {
  const t = useUiText();
  return (
    <div aria-hidden="true" className="flex items-center justify-end gap-1 text-xs text-muted">
      <span className="me-1">{t(UI_KEYS.ui.chart.less)}</span>
      {[0, 1, 2, 3, 4].map((level) => (
        <span
          key={level}
          className="size-3 rounded-[3px]"
          style={{ backgroundColor: heatShadeOf(level, color) }}
        />
      ))}
      <span className="ms-1">{t(UI_KEYS.ui.chart.more)}</span>
    </div>
  );
}
