/**
 * Stackra file contract:
 * Purpose: the web `ImageCropper`: a frame of a fixed shape (square, wide or round for an avatar) over an image that
 *          people drag to place and zoom with the slider; it reports the kept rectangle in the image's own pixels
 *          after each change, ready for a server or a canvas to cut.
 * Boundary: the frame is focusable and named by `label`, with the hint tied to it: the arrow keys move the image
 *           (Shift for bigger steps), plus and minus zoom. The image always covers the frame (`cropGeometryOf`
 *           clamps it). Moving is spatial, so it does not mirror in right-to-left. The cropper never cuts the file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1, 2.5.7 (a slider beside the drag) and 4.1.2;
 *          STA-1371 (wave C: content and media).
 */
import { cn } from "@heroui/react";
import { type KeyboardEvent, type ReactElement, useId, useRef, useState } from "react";

import { MEDIA_KEYS } from "#core/constants/media-keys.constant";
import { cropGeometryOf } from "#core/functions/crop-geometry-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImageCropperProps } from "#react/image-cropper/image-cropper.props";
import { Slider } from "#react/slider/slider";

/** The cropper's keys. */
const K = MEDIA_KEYS.ui.image_cropper;

/** One arrow-key step, in frame widths. */
const STEP = 0.02;

/** One plus or minus step of the zoom. */
const ZOOM_STEP = 0.1;

/**
 * A background position (percent) that puts an image `size` frames long at `start` frames from the frame's start:
 * a percentage there is a share of the frame's length minus the image's.
 */
const positionOf = (start: number, size: number) =>
  Math.abs(1 - size) < 1e-9 ? 0 : (start / (1 - size)) * 100;

/** A frame to place and zoom an image in. */
export function ImageCropper({
  src,
  label,
  aspectRatio = 1,
  shape = "rect",
  maxZoom = 3,
  onCropChange,
  className,
}: ImageCropperProps): ReactElement {
  const t = useUiText();
  const hintId = useId();
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const geometry = natural ? cropGeometryOf(natural, aspectRatio, zoom, offset) : null;

  const commit = (
    size: { width: number; height: number },
    nextZoom: number,
    nextOffset: { x: number; y: number },
  ) => {
    const zoomed = Math.max(1, Math.min(maxZoom, nextZoom));
    const next = cropGeometryOf(size, aspectRatio, zoomed, nextOffset);
    setZoom(zoomed);
    setOffset(next.offset);
    onCropChange?.(next.crop);
  };
  const change = (nextZoom: number, nextOffset: { x: number; y: number }) => {
    if (natural) commit(natural, nextZoom, nextOffset);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const by = event.shiftKey ? STEP * 5 : STEP;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => change(zoom, { x: offset.x - by, y: offset.y }),
      ArrowRight: () => change(zoom, { x: offset.x + by, y: offset.y }),
      ArrowUp: () => change(zoom, { x: offset.x, y: offset.y - by }),
      ArrowDown: () => change(zoom, { x: offset.x, y: offset.y + by }),
      "+": () => change(zoom + ZOOM_STEP, offset),
      "=": () => change(zoom + ZOOM_STEP, offset),
      "-": () => change(zoom - ZOOM_STEP, offset),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  };

  return (
    <div data-slot="image-cropper" className={cn("grid w-full gap-3", className)}>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- reason: the named frame is the drag and arrow-key surface; the slider beside it is the plain control (WCAG 2.5.7) */}
      <div
        ref={frame}
        role="group"
        aria-label={label ?? t(K.label)}
        aria-describedby={hintId}
        aria-busy={natural ? undefined : true}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: the frame takes the arrow keys that move the image (WCAG 2.1.1)
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          const width = frame.current?.clientWidth ?? 0;
          if (!start || width === 0) return;
          change(zoom, {
            x: start.ox + (event.clientX - start.x) / width,
            y: start.oy + (event.clientY - start.y) / width,
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        style={{ aspectRatio: String(aspectRatio) }}
        className="relative w-full cursor-grab touch-none overflow-hidden rounded-[var(--radius-panel)] bg-default outline-none select-none focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing"
      >
        {/* Only loads the file and reads its size: the picture is painted as the frame's background, so nothing
            overflows the frame (a clipped overflowing image still covers the page below it for an overlap check). */}
        <img
          src={src}
          alt=""
          hidden
          onLoad={(event) => {
            const size = {
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            };
            setNatural(size);
            commit(size, 1, { x: 0, y: 0 });
          }}
        />
        <span
          data-slot="image-cropper-image"
          style={
            geometry
              ? {
                  backgroundImage: `url(${JSON.stringify(src)})`,
                  backgroundSize: `${geometry.width * 100}% ${(geometry.height / geometry.frameHeight) * 100}%`,
                  backgroundPosition: `${positionOf(geometry.left, geometry.width)}% ${positionOf(
                    geometry.top / geometry.frameHeight,
                    geometry.height / geometry.frameHeight,
                  )}%`,
                }
              : { opacity: 0 }
          }
          className="pointer-events-none absolute inset-0 bg-no-repeat"
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 border border-white/70",
            shape === "round"
              ? "rounded-[var(--radius-pill)] shadow-[0_0_0_9999px_var(--scrim)]"
              : "rounded-[var(--radius-panel)] bg-[linear-gradient(to_right,transparent_33.2%,rgb(255_255_255/0.35)_33.3%,transparent_33.4%,transparent_66.6%,rgb(255_255_255/0.35)_66.7%,transparent_66.8%),linear-gradient(to_bottom,transparent_33.2%,rgb(255_255_255/0.35)_33.3%,transparent_33.4%,transparent_66.6%,rgb(255_255_255/0.35)_66.7%,transparent_66.8%)]",
          )}
        />
      </div>
      <Slider
        label={t(K.zoom)}
        minValue={1}
        maxValue={maxZoom}
        step={0.01}
        value={zoom}
        onChange={(value) => change(value, offset)}
        formatOptions={{ style: "percent", maximumFractionDigits: 0 }}
        isDisabled={!natural}
      />
      <p id={hintId} className="m-0 text-xs text-muted">
        {natural ? t(K.hint) : t(K.loading)}
      </p>
    </div>
  );
}
