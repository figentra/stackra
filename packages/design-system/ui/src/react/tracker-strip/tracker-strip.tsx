/**
 * Stackra file contract:
 * Purpose: the web `TrackerStrip`: an uptime-style row of equal cells, one per period, filled by state (up, degraded,
 *          down, no data), with the label and summary ("99.98% uptime") above and the start and end captions below.
 *          Pointing at a cell, or moving to it with the arrow keys, shows its period, state and note in a readout
 *          over it.
 * Boundary: the strip is one focusable `img` named by the label and summary; Left and Right move in the reading
 *           direction (from the right in Arabic), Home and End jump, Escape closes the readout, which is a polite live
 *           region. Every cell is also read from a visually hidden list, so the state never rests on colour alone
 *           (SC 1.4.1). The readout appears without motion; the cells only fade their opacity, and not under reduced
 *           motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.1,
 *          2.1.1 and 4.1.3; STA-1371.
 */
import { cn } from "@heroui/react";
import { type KeyboardEvent, type ReactElement, useId, useState } from "react";

import type { TrackerCell } from "#contracts/types/tracker-cell.type";
import { TRACKER_CELL_CLASS } from "#core/constants/tracker-cell-class.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { uptimeShareOf } from "#core/functions/uptime-share-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useUiText } from "#react/hooks/use-ui-text";
import { Text } from "#react/text/text";
import type { TrackerStripProps } from "#react/tracker-strip/tracker-strip.props";

/** The strip's words. */
const K = UI_KEYS.ui.tracker_strip;

/** An uptime-style strip of periods. */
export function TrackerStrip({
  cells,
  label,
  summary,
  startLabel,
  endLabel,
  height = 32,
  className,
}: TrackerStripProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const t = useUiText();
  const readoutId = useId();
  const [pointed, setPointed] = useState<number | null>(null);
  const share = uptimeShareOf(cells);
  const total =
    summary ??
    (share === null
      ? undefined
      : t(K.uptime, {
          value: formatChartNumber(share, locale, { style: "percent", maximumFractionDigits: 2 }),
        }));
  const textOf = (cell: TrackerCell) =>
    [t(K.cell, { label: cell.label, status: t(K[cell.status]) }), cell.note]
      .filter(Boolean)
      .join(". ");
  const last = cells.length - 1;
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const forward = isRtl ? "ArrowLeft" : "ArrowRight";
    const back = isRtl ? "ArrowRight" : "ArrowLeft";
    const next =
      event.key === forward
        ? Math.min(last, (pointed ?? -1) + 1)
        : event.key === back
          ? pointed === null
            ? last
            : Math.max(0, pointed - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : undefined;
    if (event.key === "Escape") setPointed(null);
    if (next === undefined || last < 0) return;
    event.preventDefault();
    setPointed(next);
  };
  const cell = pointed === null ? undefined : cells[pointed];
  // The readout centres over its cell, but keeps to the strip near either end.
  const place =
    pointed === null
      ? {}
      : pointed < cells.length * 0.15
        ? { insetInlineStart: `${(pointed / cells.length) * 100}%` }
        : pointed > cells.length * 0.85
          ? { insetInlineEnd: `${((last - pointed) / cells.length) * 100}%` }
          : { insetInlineStart: `${((pointed + 0.5) / cells.length) * 100}%` };
  const isCentred =
    pointed !== null && "insetInlineStart" in place && pointed >= cells.length * 0.15;
  return (
    <figure
      data-slot="tracker-strip"
      className={cn("m-0 flex w-full min-w-0 flex-col gap-2", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Text type="small" className="font-medium">
          {label}
        </Text>
        {total ? (
          <Text type="small" tone="muted" className="tabular-nums">
            {total}
          </Text>
        ) : null}
      </div>
      <div className="relative">
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- reason: the arrow keys move the readout over the image's cells; the image is not a control */}
        <div
          role="img"
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a keyboard user reaches the cells' readout only by focusing the image (WCAG 2.1.1)
          tabIndex={0}
          aria-label={[label, total].filter(Boolean).join(". ")}
          aria-describedby={cell ? readoutId : undefined}
          onKeyDown={onKeyDown}
          onBlur={() => setPointed(null)}
          onMouseLeave={() => setPointed(null)}
          className="flex w-full gap-[2px] rounded-[var(--radius-control-inner)] outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          style={{ height }}
        >
          {cells.map((item, index) => (
            <span
              key={item.key}
              aria-hidden="true"
              onMouseEnter={() => setPointed(index)}
              className={cn(
                "min-w-0 flex-1 rounded-[var(--radius-control-inner)] motion-safe:transition-opacity",
                TRACKER_CELL_CLASS[item.status],
                pointed !== null && pointed !== index && "opacity-50",
              )}
            />
          ))}
        </div>
        <div
          id={readoutId}
          role="status"
          className={cn(
            "pointer-events-none absolute bottom-full z-10 mb-2 grid max-w-64 gap-0.5 rounded-[var(--radius)] border border-separator bg-overlay px-3 py-2 text-xs text-overlay-foreground shadow-overlay",
            !cell && "sr-only",
            isCentred && "-translate-x-1/2 rtl:translate-x-1/2",
          )}
          style={place}
        >
          {cell ? (
            <>
              <span className="font-medium text-muted">{cell.label}</span>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-[var(--radius-pill)]",
                    TRACKER_CELL_CLASS[cell.status],
                  )}
                />
                {t(K[cell.status])}
              </span>
              {cell.note ? <span>{cell.note}</span> : null}
            </>
          ) : null}
        </div>
      </div>
      {startLabel || endLabel ? (
        <div className="flex justify-between gap-3">
          <Text type="small" tone="muted">
            {startLabel}
          </Text>
          <Text type="small" tone="muted">
            {endLabel}
          </Text>
        </div>
      ) : null}
      <ul className="sr-only">
        {cells.map((item) => (
          <li key={item.key}>{textOf(item)}</li>
        ))}
      </ul>
    </figure>
  );
}
