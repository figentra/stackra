/**
 * Stackra file contract:
 * Purpose: the "video" demo of the web MediaPlayer: a short generated clip with Arabic and English captions, the speed
 *          menu and full screen.
 * Boundary: a demo with no props, @stackra/ui only; the clip and captions are small files in `public/media`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { MediaPlayer, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MEDIA_PLAYER_KEYS } from "#src/demos/free/media-player/media-player-keys.constant";

/** The demo's keys. */
const K = MEDIA_PLAYER_KEYS.media_player.video;

/** A video player with Arabic and English captions. */
export default function Video() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <MediaPlayer
      className="max-w-xl"
      src="/media/sample-clip.webm"
      label={t(K.label)}
      tracks={[
        { src: "/media/sample-clip.ar.vtt", language: "ar", label: t(K.arabic) },
        { src: "/media/sample-clip.en.vtt", language: "en", label: t(K.english) },
      ]}
    />
  );
}
