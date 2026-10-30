/**
 * Stackra file contract:
 * Purpose: the "avatar" demo of the web ImageCropper: a round frame over a square photo; drag it, zoom with the slider
 *          or the plus and minus keys, and the line under it writes the rectangle that would be kept.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import type { ImageCrop } from "@stackra/ui/contracts";
import { ImageCropper, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { IMAGE_CROPPER_KEYS } from "#src/demos/free/image-cropper/image-cropper-keys.constant";

/** The demo's keys. */
const K = IMAGE_CROPPER_KEYS.image_cropper;

/** ImageCropper: a round avatar. */
export default function Avatar() {
  const t = useCatalogueText(MESSAGES.en);
  const [crop, setCrop] = useState<ImageCrop | null>(null);
  return (
    <div className="grid w-full max-w-xs gap-3">
      <ImageCropper
        label={t(K.avatar_label)}
        src={DEMO_PHOTOS[2]?.src ?? ""}
        shape="round"
        onCropChange={setCrop}
      />
      {crop ? (
        <p className="m-0 text-sm text-muted tabular-nums">
          {t(K.kept, { width: crop.width, height: crop.height, x: crop.x, y: crop.y })}
        </p>
      ) : null}
    </div>
  );
}
