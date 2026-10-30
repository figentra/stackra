/**
 * Stackra file contract:
 * Purpose: `masonryColumnsOf`, which deals pictures into masonry columns: each goes to the shortest column so far,
 *          measured by height over width (a square when the size is unknown), so the columns end near level.
 * Boundary: pure; keeps each picture's position in the input so a press can open the right one.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: shared logic in core); STA-1371 (wave C: content and media).
 */
import type { GalleryImage } from "#contracts/types/gallery-image.type";

/** The pictures of each column, with their positions in `images`. */
export function masonryColumnsOf(
  images: readonly GalleryImage[],
  columns: number,
): { readonly image: GalleryImage; readonly position: number }[][] {
  const count = Math.max(1, Math.floor(columns));
  const out = Array.from(
    { length: count },
    () => [] as { image: GalleryImage; position: number }[],
  );
  const heights = Array.from({ length: count }, () => 0);
  images.forEach((image, position) => {
    const shortest = heights.indexOf(Math.min(...heights));
    out[shortest]?.push({ image, position });
    heights[shortest] =
      (heights[shortest] ?? 0) + (image.width && image.height ? image.height / image.width : 1);
  });
  return out;
}
