/**
 * Stackra file contract:
 * Purpose: the web `ChoroplethMap`: the caller's GeoJSON regions shaded in five steps of one colour by value (hatched
 *          for a region with none, so a pale region with data never reads as a gap), the pointed region's name and value above the map, a Less–More scale under it, and
 *          every region in the data table.
 * Boundary: SVG paths from `choroplethShapesOf` in a fixed box kept to its aspect; no map data ships here. A map is
 *           never mirrored; the scale follows the reading direction. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); RFC 7946; WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { type ReactElement, useId, useState } from "react";

import { CHART_SHADES } from "#core/constants/chart-shades.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { choroplethShapesOf } from "#core/functions/choropleth-shapes-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { valueLevelOf } from "#core/functions/value-level-of.function";
import type { ChoroplethShape } from "#core/types/choropleth-shape.type";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import type { ChoroplethMapProps } from "#react/choropleth-map/choropleth-map.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** The projection box; the SVG scales it to fit, aspect kept. */
const BOX = { width: 1000, height: 600 } as const;

/** Regions shaded by value. */
export function ChoroplethMap({
  features,
  values,
  idKey,
  nameKey,
  label,
  valueFormat,
  color = "chart-ramp-1",
  height = 280,
  className,
}: ChoroplethMapProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const K = UI_KEYS.ui.chart;
  const [active, setActive] = useState<ChoroplethShape | null>(null);
  const id = useId().replaceAll(/[^\w-]/g, "");
  const shapes = choroplethShapesOf(features, { ...BOX, values, idKey, nameKey });
  const known = shapes.flatMap((shape) => (shape.value === null ? [] : [shape.value]));
  const [min, max] = [Math.min(...known), Math.max(...known)];
  const value = (figure: number | null) =>
    figure === null ? t(K.no_data) : formatChartNumber(figure, locale, valueFormat);
  const fill = paintOf(color);
  const table = {
    head: [t(K.region), t(K.value)],
    rows: shapes.map((shape) => [shape.name, value(shape.value)]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <p aria-hidden="true" className="m-0 min-h-5 text-center text-xs text-muted">
        {active ? (
          <>
            {active.name}{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {value(active.value)}
            </span>
          </>
        ) : null}
      </p>
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="w-full"
        style={{ height }}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          {/* No data is hatched, the cartographer's mark for it, so the palest shade still reads as a value. */}
          <pattern
            id={`${id}-none`}
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="12" height="12" {...CHART_PAINT.track} />
            <line y2="12" stroke={paintOf("muted")} strokeOpacity={0.45} strokeWidth={3} />
          </pattern>
        </defs>
        {shapes.map((shape) => (
          <path
            key={shape.id}
            d={shape.path}
            fillRule="evenodd"
            fill={shape.value === null ? `url(#${id}-none)` : fill}
            fillOpacity={
              shape.value === null ? 1 : CHART_SHADES[valueLevelOf(shape.value, min, max)]
            }
            // A muted outline keeps the palest regions apart from each other and from the card.
            stroke={active?.id === shape.id ? paintOf("foreground") : paintOf("muted")}
            strokeOpacity={active?.id === shape.id ? 1 : 0.45}
            strokeWidth={active?.id === shape.id ? 2 : 1}
            vectorEffect="non-scaling-stroke"
            onPointerEnter={() => setActive(shape)}
          />
        ))}
      </svg>
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-1.5 text-xs text-muted"
      >
        <span>{t(K.less)}</span>
        {CHART_SHADES.map((shade) => (
          <svg key={shade} viewBox="0 0 10 10" className="size-2.5">
            <rect width="10" height="10" rx="2" fill={fill} fillOpacity={shade} />
          </svg>
        ))}
        <span>{t(K.more)}</span>
        {known.length < shapes.length ? (
          <>
            <svg viewBox="0 0 10 10" className="ms-3 size-2.5">
              <defs>
                <pattern
                  id={`${id}-none-key`}
                  width="4"
                  height="4"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="4" height="4" {...CHART_PAINT.track} />
                  <line y2="4" stroke={paintOf("muted")} strokeOpacity={0.45} strokeWidth={1.2} />
                </pattern>
              </defs>
              <rect width="10" height="10" rx="2" fill={`url(#${id}-none-key)`} />
            </svg>
            <span>{t(K.no_data)}</span>
          </>
        ) : null}
      </div>
    </ChartFrame>
  );
}
