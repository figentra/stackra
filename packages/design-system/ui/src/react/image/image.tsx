/**
 * Stackra file contract:
 * Purpose: the web `Image`: a picture as wide as its container at `aspectRatio` (16 / 9 by default), with the
 *          container radius and an optional caption. It is the Thumbnail stretched to the width, so it loads lazily,
 *          blurs up from `placeholderSrc`, fades in and falls back to an icon the same way. `isZoomable` makes it a
 *          button ("Open <alt>") that opens it full size in the Lightbox.
 * Boundary: no loading logic of its own (Thumbnail's). Decorative unless `alt` names it; a zoomable image needs `alt`,
 *           which then names its button. The caption is a `figcaption`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1, 2.1.1 and 4.1.2; STA-1371 (gap build, owner approval
 *          2026-10-31).
 */
import { cn } from "@heroui/react";
import { useState, type ReactElement } from "react";

import { MEDIA_KEYS } from "#core/constants/media-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImageProps } from "#react/image/image.props";
import { Lightbox } from "#react/lightbox/lightbox";
import { Thumbnail } from "#react/thumbnail/thumbnail";

/** The container radius, over the Thumbnail's own. */
const RADIUS = "rounded-[var(--radius-container)]";

/** A fluid picture with a placeholder, a fallback, a caption and an optional zoom. */
export function Image({
  src,
  placeholderSrc,
  alt,
  aspectRatio = 16 / 9,
  fit,
  fallback,
  caption,
  isZoomable,
  className,
}: ImageProps): ReactElement {
  const t = useUiText();
  const [isOpen, setOpen] = useState(false);
  const zoomed = isZoomable && src && alt ? { src, alt } : undefined;
  const picture = (
    <Thumbnail
      {...omitUndefined({ src, placeholderSrc, fit, fallback })}
      {...(zoomed ? {} : omitUndefined({ alt }))}
      aspectRatio={aspectRatio}
      className={cn("flex", RADIUS)}
      style={{ width: "100%" }}
    />
  );
  return (
    <figure data-slot="image" className={cn("m-0 grid w-full gap-2", className)}>
      {zoomed ? (
        <button
          type="button"
          aria-label={t(MEDIA_KEYS.ui.gallery.open, { name: zoomed.alt })}
          onClick={() => setOpen(true)}
          className={cn(
            "block w-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-focus",
            RADIUS,
          )}
        >
          {picture}
        </button>
      ) : (
        picture
      )}
      {caption ? <figcaption className="text-sm text-muted">{caption}</figcaption> : null}
      {zoomed ? (
        <Lightbox
          images={[{ id: zoomed.src, ...zoomed, ...omitUndefined({ caption }) }]}
          label={zoomed.alt}
          isOpen={isOpen}
          onOpenChange={setOpen}
        />
      ) : null}
    </figure>
  );
}
