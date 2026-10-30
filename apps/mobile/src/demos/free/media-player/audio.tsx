/**
 * Stackra file contract:
 * Purpose: the "audio" demo of the native MediaPlayer: a voice-note style clip (a short generated tone) under its
 *          title, with a line once it has played to the end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the tone is a small M4A in `assets/media`.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (owner approval 2026-10-30).
 */
import { MediaPlayer, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { Image, View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MEDIA_PLAYER_DEMO_KEYS } from "#src/demos/free/media-player/media-player-demo-keys.constant";

/** The demo's keys. */
const K = MEDIA_PLAYER_DEMO_KEYS.demo_free.media_player.audio;

/** The bundled tone's address. */
const TONE = Image.resolveAssetSource(require("../../../../assets/media/sample-tone.m4a")).uri;

/** An audio player that says when the track has ended. */
export default function Audio() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOver, setIsOver] = useState(false);
  return (
    <View className="gap-2">
      <Text className="font-medium">{t(K.title)}</Text>
      <MediaPlayer kind="audio" src={TONE} label={t(K.label)} onEnded={() => setIsOver(true)} />
      {isOver ? <Text tone="muted">{t(K.ended)}</Text> : null}
    </View>
  );
}
