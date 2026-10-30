/**
 * Stackra file contract:
 * Purpose: the "video" demo of the web AspectRatio: a 16:9 video card's poster frame with its title and length, the
 *          space held before anything loads.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { AspectRatio, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ASPECT_RATIO_KEYS } from "#src/demos/free/aspect-ratio/aspect-ratio-keys.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";

/** The demo's keys. */
const K = ASPECT_RATIO_KEYS.aspect_ratio.video;

/** The poster. */
const POSTER = DEMO_PHOTOS[6]?.src ?? "";

/** AspectRatio: a 16:9 video. */
export default function Video() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-xl gap-2">
      <AspectRatio ratio={16 / 9} className="bg-default">
        {/* The card shows the video's poster frame; the player (with its captions) loads only once it is opened.
            The title is the text below, so the frame is decorative. */}
        <img src={POSTER} alt="" />
      </AspectRatio>
      <div className="flex items-baseline justify-between gap-3">
        <Text className="font-medium">{t(K.title)}</Text>
        <Text type="small" tone="muted">
          {t(K.duration)}
        </Text>
      </div>
    </div>
  );
}
