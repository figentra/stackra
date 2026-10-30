/**
 * Stackra file contract:
 * Purpose: the "audio" demo of the web MediaPlayer: a voice-note style clip (a short generated tone) under its title,
 *          with a line once it has played to the end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the tone is a small WAV in `public/media`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { MediaPlayer, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MEDIA_PLAYER_KEYS } from "#src/demos/free/media-player/media-player-keys.constant";

/** The demo's keys. */
const K = MEDIA_PLAYER_KEYS.media_player.audio;

/** An audio player that says when the track has ended. */
export default function Audio() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOver, setIsOver] = useState(false);
  return (
    <div className="grid max-w-md gap-2">
      <Text className="font-medium">{t(K.title)}</Text>
      <MediaPlayer
        kind="audio"
        src="/media/sample-tone.wav"
        label={t(K.label)}
        onEnded={() => setIsOver(true)}
      />
      {isOver ? <Text tone="muted">{t(K.ended)}</Text> : null}
    </div>
  );
}
