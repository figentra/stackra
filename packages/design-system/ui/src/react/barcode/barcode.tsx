/**
 * Stackra file contract:
 * Purpose: the web `Barcode`: a value as a Code 128 or EAN-13 barcode (`barcodeOf`, our own encoder) drawn in SVG,
 *          dark bars on a light tile with the quiet zone, the digits under it. An invalid value shows an error line.
 * Boundary: an image named by `label` or the value. Always dark on light in both themes (scanners need it) and laid
 *           out left to right even in Arabic: a barcode never mirrors.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1; ISO/IEC 15417; ISO/IEC 15420; STA-1371 (wave D,
 *          owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import { useMemo, type ReactElement } from "react";

import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { barcodeOf } from "#core/functions/barcode-of.function";
import type { BarcodeProps } from "#react/barcode/barcode.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** The barcode's words. */
const K = LONG_TAIL_KEYS.ui.barcode;

/** Pixels per module. */
const MODULE = 2;

/** A linear barcode. */
export function Barcode({
  value,
  format = "code128",
  label,
  height = 64,
  showText = true,
  className,
}: BarcodeProps): ReactElement {
  const t = useUiText();
  const drawing = useMemo(() => barcodeOf(value, format, height), [value, format, height]);
  if (drawing === null) {
    return (
      <p
        data-slot="barcode"
        data-invalid="true"
        className={cn(
          "inline-block rounded-[var(--radius-container)] border border-danger bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground",
          className,
        )}
      >
        {t(K.invalid)}
      </p>
    );
  }
  return (
    <div
      role="img"
      aria-label={label ?? drawing.text}
      dir="ltr"
      data-slot="barcode"
      className={cn(
        "inline-flex flex-col items-center gap-1 rounded-[var(--radius-container)] bg-white pt-3 pb-2 text-black",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        width={drawing.width * MODULE}
        height={height}
        viewBox={`0 0 ${drawing.width} ${height}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="block"
      >
        <path d={drawing.path} className="fill-black" />
      </svg>
      {showText ? (
        <span aria-hidden="true" className="font-mono text-sm leading-none">
          {drawing.text}
        </span>
      ) : null}
    </div>
  );
}
