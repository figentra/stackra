/**
 * Stackra file contract:
 * Purpose: the web `Gallery`: pictures as a grid of square tiles or a masonry of their own shapes in columns; a press
 *          on a tile opens the picture in the Lightbox, where the others are a swipe or an arrow key away.
 * Boundary: a list named by `label`, each tile a native button named "Open <alt>"; focus returns to the tile when the
 *           lightbox closes. Masonry is CSS columns, so pictures read down each column; a picture's `width` and
 *           `height` hold its shape before it loads. Tiles lift on hover only at full motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); ADR 0329 (motion); WCAG 2.2 SC 1.1.1, 2.1.1
 *          and 4.1.2; STA-1371 (wave C: content and media).
 */
import { cn } from "@heroui/react";
import { type CSSProperties, type ReactElement, useState } from "react";

import { MEDIA_KEYS } from "#core/constants/media-keys.constant";
import { useMotion } from "#react/design-system-provider/use-motion";
import type { GalleryProps } from "#react/gallery/gallery.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Lightbox } from "#react/lightbox/lightbox";

/** The gallery's keys. */
const K = MEDIA_KEYS.ui.gallery;

/** Pictures in a grid or a masonry that open in a lightbox. */
export function Gallery({
  images,
  label,
  layout = "grid",
  columns = 3,
  hasLightbox = true,
  onImagePress,
  className,
}: GalleryProps): ReactElement {
  const t = useUiText();
  const motion = useMotion();
  const [open, setOpen] = useState<number | null>(null);
  const isMasonry = layout === "masonry";
  // Two columns on a narrow screen, the asked-for count from the small breakpoint up.
  const style = { "--gallery-columns": String(columns) } as CSSProperties;

  return (
    <>
      <ul
        aria-label={label}
        data-slot="gallery"
        data-layout={layout}
        style={style}
        className={cn(
          "m-0 w-full list-none p-0",
          isMasonry
            ? "columns-2 gap-2 sm:[column-count:var(--gallery-columns)]"
            : "grid grid-cols-2 gap-2 sm:grid-cols-[repeat(var(--gallery-columns),minmax(0,1fr))]",
          className,
        )}
      >
        {images.map((image, position) => (
          <li key={image.id} className={isMasonry ? "mb-2 break-inside-avoid" : ""}>
            <button
              type="button"
              aria-label={t(K.open, { name: image.alt })}
              onClick={() => {
                if (hasLightbox) setOpen(position);
                onImagePress?.(image.id);
              }}
              className={cn(
                "group block w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-control)] bg-default outline-none focus-visible:ring-2 focus-visible:ring-focus",
                hasLightbox ? "" : "cursor-pointer",
              )}
            >
              <img
                src={image.thumbnailSrc ?? image.src}
                alt=""
                loading="lazy"
                {...(image.width && image.height
                  ? { width: image.width, height: image.height }
                  : {})}
                className={cn(
                  "block w-full object-cover",
                  isMasonry ? "h-auto" : "aspect-square",
                  motion === "full" &&
                    "transition-transform duration-(--duration-slow) group-hover:scale-105",
                )}
              />
            </button>
          </li>
        ))}
      </ul>
      {hasLightbox ? (
        <Lightbox
          images={images}
          label={label}
          isOpen={open !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null);
          }}
          index={open ?? 0}
          onIndexChange={setOpen}
        />
      ) : null}
    </>
  );
}
