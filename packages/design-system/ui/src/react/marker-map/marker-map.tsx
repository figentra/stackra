/**
 * Stackra file contract:
 * Purpose: the web `MarkerMap`: pins placed by latitude and longitude on an SVG (sized by their count, the selected one
 *          ringed and drawn on top) as the page of a `SidePanel`, and the same pins as a single-select `List` in the
 *          panel beside it. Choosing a pin on the map or in the list selects it in both; the selection is controlled
 *          (`selectedId`, `onSelect`) or kept here.
 * Boundary: no map tiles and no map library: `markerPointsOf` projects the pins into a fixed box kept to its aspect,
 *           like `ChoroplethMap`, with no basemap behind them. The SVG is one image named by `label`; its pins answer
 *           the pointer only, and the list is the keyboard and screen-reader way to the same choice. A map is never
 *           mirrored; the panel sits on the end edge, so in right-to-left it is on the left, and below `md` it is the
 *           SidePanel's drawer, opened from its launcher. Every word is the caller's (`label`, `listLabel`, the pins'
 *           labels); counts are formatted in the active locale.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and
 *          2.1.1; STA-1981.
 */
import { useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { paintOf } from "#react/chart/paint-of.function";
import { List } from "#react/list/list";
import type { MarkerMapProps } from "#react/marker-map/marker-map.props";
import { markerPointsOf } from "#react/marker-map/marker-points-of.function";
import { SidePanel } from "#react/side-panel/side-panel";

/** The projection box; the SVG scales it to fit, aspect kept. */
const BOX = { width: 1000, height: 600 } as const;

/** Pins located on a map, with their list. */
export function MarkerMap({
  markers,
  selectedId,
  onSelect,
  label,
  listLabel,
  height = 360,
  className,
}: MarkerMapProps): ReactElement {
  const { locale } = useLocale();
  const [own, setOwn] = useState<string | null>(null);
  const current = selectedId === undefined ? own : selectedId;
  const select = (id: string) => {
    if (selectedId === undefined) setOwn(id);
    onSelect?.(id);
  };
  const number = new Intl.NumberFormat(locale);
  // A row's spoken name joins the label and the count the locale's way.
  const spoken = new Intl.ListFormat(locale, { type: "unit", style: "narrow" });
  const most = Math.max(1, ...markers.map((marker) => marker.count ?? 0));
  const radiusOf = (count: number | undefined) =>
    count === undefined ? 8 : 6 + 10 * Math.sqrt(Math.max(0, count) / most);
  const points = markerPointsOf(markers, BOX);
  const byId = new Map(markers.map((marker) => [marker.id, marker]));
  // The selected pin is drawn last, so nothing covers it.
  const ordered = [
    ...points.filter((point) => point.id !== current),
    ...points.filter((point) => point.id === current),
  ];
  const title = listLabel ?? label;
  return (
    <SidePanel label={title} defaultState="open" className={className}>
      <SidePanel.Inset>
        <svg
          role="img"
          aria-label={label}
          viewBox={`0 0 ${BOX.width} ${BOX.height}`}
          className="w-full"
          style={{ height }}
        >
          <rect width={BOX.width} height={BOX.height} rx={16} {...CHART_PAINT.track} />
          {ordered.map((point) => {
            const isSelected = point.id === current;
            return (
              <circle
                key={point.id}
                data-id={point.id}
                data-selected={isSelected || undefined}
                cx={point.x}
                cy={point.y}
                r={radiusOf(byId.get(point.id)?.count) + (isSelected ? 3 : 0)}
                fill={paintOf("chart-1")}
                stroke={isSelected ? paintOf("foreground") : CHART_PAINT.surface}
                strokeWidth={isSelected ? 3 : 2}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer"
                // Pointer only: the list beside the map is the keyboard and screen-reader way to the same choice.
                onClick={() => select(point.id)}
              />
            );
          })}
        </svg>
      </SidePanel.Inset>
      <SidePanel.Panel>
        <SidePanel.Header isExpandable={false}>
          <span className="font-semibold">{title}</span>
        </SidePanel.Header>
        <SidePanel.Body>
          <List
            label={title}
            selectionMode="single"
            selectedKeys={current === null ? [] : [current]}
            onSelectionChange={(keys) => {
              const [id] = keys;
              if (id !== undefined) select(id);
            }}
            isAnimated={false}
            items={markers.map((marker) => ({
              id: marker.id,
              title: marker.label,
              ...(marker.count === undefined
                ? { label: marker.label }
                : {
                    label: spoken.format([marker.label, number.format(marker.count)]),
                    endContent: (
                      <span className="text-sm text-muted tabular-nums">
                        {number.format(marker.count)}
                      </span>
                    ),
                  }),
            }))}
          />
        </SidePanel.Body>
      </SidePanel.Panel>
      <SidePanel.Launcher title={title} />
    </SidePanel>
  );
}
