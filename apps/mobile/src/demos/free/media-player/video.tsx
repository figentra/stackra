/**
 * Stackra file contract:
 * Purpose: the "video" demo of the native MediaPlayer: a short generated clip that carries Arabic and English
 *          captions, with the speed menu and full screen.
 * Boundary: a demo with no props, @stackra/ui only; the clip is a small MP4 in `assets/media`, its captions inside it
 *           (expo-video plays the captions a file carries).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (owner approval 2026-10-30).
 */
import { MediaPlayer, useCatalogueText } from "@stackra/ui/native";
import { Image } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MEDIA_PLAYER_DEMO_KEYS } from "#src/demos/free/media-player/media-player-demo-keys.constant";

/** The demo's keys. */
const K = MEDIA_PLAYER_DEMO_KEYS.demo_free.media_player.video;

/** The bundled clip's address. */
const CLIP = Image.resolveAssetSource(require("../../../../assets/media/sample-clip.mp4")).uri;

/** A video player with captions in the file. */
export default function Video() {
  const t = useCatalogueText(MESSAGES.en);
  return <MediaPlayer src={CLIP} label={t(K.label)} />;
}
