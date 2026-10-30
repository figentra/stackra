/**
 * Stackra file contract:
 * Purpose: the web `Thumbnail`: a resource's image (a product, a menu item, a file) in a fixed-width box of the given
 *          aspect ratio with the theme's large radius. A blurred `placeholderSrc` shows while `src` loads, then the
 *          image fades in over it; with no image, or a broken one, an image icon shows on the default fill.
 * Boundary: the fade is a CSS opacity transition of the theme's `base` step; reduced motion shows the image at once.
 *           Decorative unless `alt` names it as one image. Colours and radius are tokens.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; design-system gap inventory row 12; WCAG 2.2 SC 1.1.1.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useReducedMotion } from "motion/react";
import { useState } from "react";

import { THUMBNAIL_RADIUS_CLASS_NAME } from "#core/constants/thumbnail-radius-class-name.constant";
import { THUMBNAIL_WIDTHS } from "#core/constants/thumbnail-widths.constant";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { ThumbnailProps } from "#react/thumbnail/thumbnail.props";

const BASE = motionTiming(STACKRA_THEME, "base");

/** A square (or `aspectRatio`) image of a resource, with a blur-up placeholder and an icon fallback. */
export function Thumbnail({
  src,
  placeholderSrc,
  alt,
  size = "md",
  aspectRatio = 1,
  fit = "cover",
  fallback,
  className,
  style,
  ...rest
}: ThumbnailProps): ReactElement {
  const isReduced = useReducedMotion() ?? false;
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  // A new `src` starts loading again; set during render so the old image's state never shows for a frame.
  const [shownSrc, setShownSrc] = useState(src);
  if (src !== shownSrc) {
    setShownSrc(src);
    setStatus("loading");
  }
  const showsFallback = !src || status === "error";
  const accessibility = alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true };
  const image = "absolute inset-0 size-full";

  return (
    <span
      {...rest}
      {...accessibility}
      data-slot="thumbnail"
      data-status={src ? status : "empty"}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-default text-muted",
        THUMBNAIL_RADIUS_CLASS_NAME,
        className,
      )}
      style={{ width: THUMBNAIL_WIDTHS[size], aspectRatio, ...style }}
    >
      {showsFallback ? (
        <SlotIcon icon={fallback ?? (src ? "image-off" : "image")} />
      ) : (
        <>
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt=""
              data-slot="thumbnail-placeholder"
              className={cn(image, "scale-110 blur-md")}
              style={{ objectFit: fit }}
            />
          ) : null}
          <img
            src={src}
            alt=""
            data-slot="thumbnail-image"
            // A cached image can finish before React attaches `onLoad`, so a complete one counts as loaded.
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0 && status === "loading")
                setStatus("loaded");
            }}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className={image}
            style={{
              objectFit: fit,
              opacity: status === "loaded" ? 1 : 0,
              ...(isReduced ? {} : { transition: `opacity ${BASE.durationMs}ms ease-out` }),
            }}
          />
        </>
      )}
    </span>
  );
}
