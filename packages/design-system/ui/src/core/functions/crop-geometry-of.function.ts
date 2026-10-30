/**
 * Stackra file contract:
 * Purpose: `cropGeometryOf`, the arithmetic of an ImageCropper: the image is scaled to just cover a frame of the given
 *          aspect ratio, times the zoom, and moved by an offset from the centre; the offset is clamped so no gap
 *          opens, and the kept rectangle is returned in the image's own pixels.
 * Boundary: pure; lengths in frame widths (the frame is 1 wide), the crop in natural pixels, rounded.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: shared logic in core); STA-1371 (wave C: content and media).
 */
import type { CropGeometry } from "#core/types/crop-geometry.type";

/** Where the image sits in the frame and what the frame keeps. */
export function cropGeometryOf(
  natural: { readonly width: number; readonly height: number },
  aspectRatio: number,
  zoom: number,
  offset: { readonly x: number; readonly y: number },
): CropGeometry {
  const frameHeight = 1 / aspectRatio;
  // The scale, in frame widths per natural pixel, at which the image just covers the frame.
  const scale = Math.max(1 / natural.width, frameHeight / natural.height) * Math.max(1, zoom);
  const width = natural.width * scale;
  const height = natural.height * scale;
  const maxX = (width - 1) / 2;
  const maxY = (height - frameHeight) / 2;
  const x = Math.max(-maxX, Math.min(maxX, offset.x)) + 0;
  const y = Math.max(-maxY, Math.min(maxY, offset.y)) + 0;
  const left = 0.5 + x - width / 2;
  const top = frameHeight / 2 + y - height / 2;
  return {
    frameHeight,
    width,
    height,
    left,
    top,
    offset: { x, y },
    crop: {
      // `+ 0` turns a -0 into 0, so a caller's equality checks see a plain zero.
      x: Math.round(-left / scale) + 0,
      y: Math.round(-top / scale) + 0,
      width: Math.round(1 / scale),
      height: Math.round(frameHeight / scale),
    },
  };
}
