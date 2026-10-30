/**
 * Stackra file contract:
 * Purpose: `useMediaPlayerState(playbackRates, format)`, the state and words every runtime's MediaPlayer shares: what
 *          the platform player last reported (`patch` takes its events) and the controls' names and value texts in the
 *          locale and the customer's digits: the time ("0:12 / 1:05"), the play, mute and speed names, the volume as
 *          a percentage and the speed menu's sections.
 * Boundary: a React hook with no rendering; the runtimes draw the controls and drive their own player (`<video>` on
 *           web, `expo-video` on native). `format` is the runtime's own number writer.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits); STA-1371 (owner approval 2026-10-30).
 */
import { useNumerals } from "@stackra/i18n/react";
import { useState } from "react";

import type { MenuSection } from "#contracts/types/menu-section.type";
import { MEDIA_TIME_KEYS } from "#core/constants/media-time-keys.constant";
import { mediaTimeOf } from "#core/functions/media-time-of.function";
import type { MediaPlayerState } from "#core/types/media-player-state.type";
import { useUiText } from "#react/hooks/use-ui-text";

/** The player's words. */
const K = MEDIA_TIME_KEYS.ui.media_player;

/** A player at rest: stopped at the start, at full volume, normal speed, no captions. */
const START: MediaPlayerState = {
  isPlaying: false,
  time: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  isMuted: false,
  rate: 1,
  hasCaptions: false,
};

/** The shared MediaPlayer state and words. */
export function useMediaPlayerState(
  playbackRates: readonly number[],
  format: (value: number, options?: Intl.NumberFormatOptions) => string,
): {
  readonly state: MediaPlayerState;
  readonly patch: (next: Partial<MediaPlayerState>) => void;
  /** Muted or at zero volume. */
  readonly isSilent: boolean;
  /** The volume the slider shows: 0 while muted. */
  readonly shownVolume: number;
  /** "0:12 / 1:05". */
  readonly timeText: string;
  readonly seekLabel: string;
  /** "0:12 of 1:05", what a screen reader says for the timeline. */
  readonly seekText: string;
  readonly playLabel: string;
  readonly muteLabel: string;
  readonly volumeLabel: string;
  readonly volumeText: string;
  /** "1.5×", the speed button's text. */
  readonly speedText: string;
  /** "Playback speed: 1.5×", the speed button's name (it carries the shown text, WCAG 2.5.3). */
  readonly speedLabel: string;
  readonly speedSections: readonly MenuSection[];
  readonly captionsLabel: string;
  readonly fullscreenLabel: (isFullscreen: boolean) => string;
} {
  const t = useUiText();
  const numerals = useNumerals();
  const [state, setState] = useState(START);
  const patch = (next: Partial<MediaPlayerState>) => setState((now) => ({ ...now, ...next }));
  const isSilent = state.isMuted || state.volume === 0;
  const shownVolume = state.isMuted ? 0 : state.volume;
  const elapsed = mediaTimeOf(state.time, numerals);
  const total = mediaTimeOf(state.duration, numerals);
  const speedText = `${format(state.rate)}×`;
  return {
    state,
    patch,
    isSilent,
    shownVolume,
    timeText: `${elapsed} / ${total}`,
    seekLabel: t(K.seek),
    seekText: t(K.time_of, { elapsed, duration: total }),
    playLabel: t(state.isPlaying ? K.pause : K.play),
    muteLabel: t(isSilent ? K.unmute : K.mute),
    volumeLabel: t(K.volume),
    volumeText: format(shownVolume, { style: "percent" }),
    speedText,
    speedLabel: `${t(K.speed)}: ${speedText}`,
    speedSections: [
      {
        id: "speed",
        title: t(K.speed),
        isTitleHidden: true,
        items: playbackRates.map((speed) => ({
          id: String(speed),
          label: speed === 1 ? t(K.normal_speed) : `${format(speed)}×`,
        })),
      },
    ],
    captionsLabel: t(K.captions),
    fullscreenLabel: (isFullscreen) => t(isFullscreen ? K.exit_fullscreen : K.fullscreen),
  };
}
