/**
 * Stackra file contract:
 * Purpose: `MEDIA_PLAYER_ICONS`, the drawings of the native MediaPlayer's controls: play, pause, the speaker on and
 *          off, captions and full screen.
 * Boundary: a registry the player nests around its own controls only, so it never touches the app's or `UI_ICONS`.
 *           None of them is mirrored in right-to-left (a play triangle points the way time runs on the timeline).
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); STA-1371 (owner approval 2026-10-30).
 */
import { defineIconRegistry } from "@stackra/icons";
import {
  Captions,
  CaptionsOff,
  Maximize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "@stackra/icons/native/lucide-icons";

/** The icons the native MediaPlayer draws on its own. */
export const MEDIA_PLAYER_ICONS = defineIconRegistry({
  captions: Captions,
  "captions-off": CaptionsOff,
  maximize: Maximize,
  pause: Pause,
  play: Play,
  "volume-2": Volume2,
  "volume-x": VolumeX,
});
