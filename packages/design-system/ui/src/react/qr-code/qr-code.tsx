/**
 * Stackra file contract:
 * Purpose: the web `QrCode`: a text or link as an SVG QR code (`qrPathOf`), dark modules on a light tile with the
 *          quiet zone, on the container radius.
 * Boundary: an image named by `label`. Always dark on light, in both themes, because many scanners cannot read an
 *           inverted code; never mirrored in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1; ISO/IEC 18004; STA-1371.
 */
import { cn } from "@heroui/react";
import { useMemo, type ReactElement } from "react";

import { qrPathOf } from "#core/functions/qr-path-of.function";
import type { QrCodeProps } from "#react/qr-code/qr-code.props";

/** A QR code. */
export function QrCode({ value, label, size = 160, level = "M", className }: QrCodeProps): ReactElement {
  const qr = useMemo(() => qrPathOf(value, level), [value, level]);
  return (
    <svg
      role="img"
      aria-label={label}
      data-slot="qr-code"
      width={size}
      height={size}
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      shapeRendering="crispEdges"
      className={cn("block rounded-[var(--radius-container)] bg-white", className)}
    >
      <path d={qr.path} className="fill-black" />
    </svg>
  );
}
