/**
 * Stackra file contract:
 * Purpose: `MEDIA_TIME_KEYS`, the typed keys of the MediaPlayer's own words in `assets/lang/<locale>/ui.json`
 *          (`ui::media_player.*`). The TimeClock reuses the wheel words (`ui::wheel.hour`, `minute`, `period`) and the
 *          AngleSlider says its value through Intl's degree unit, so neither has keys of its own.
 * Boundary: internal: the web components import it by path. Kept apart from `UI_KEYS` so the wave D components land
 *           without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { keys } from "@stackra/i18n";

/** The MediaPlayer's keys. */
export const MEDIA_TIME_KEYS = keys({
  ui: {
    media_player: [
      "play",
      "pause",
      "mute",
      "unmute",
      "volume",
      "seek",
      "time_of",
      "speed",
      "normal_speed",
      "captions",
      "fullscreen",
      "exit_fullscreen",
    ],
  },
});
