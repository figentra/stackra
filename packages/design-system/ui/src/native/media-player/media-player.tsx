/**
 * Stackra file contract:
 * Purpose: the native `MediaPlayer`: a video or audio file with the house controls, on `expo-video` (see
 *          `MediaPlayerSurface` for the controls).
 * Boundary: without the optional `expo-video` peer, or in a dev client built without it, the player shows its name in
 *           a frame and no controls, so an app without the peer still runs.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (owner approval 2026-10-30).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { loadVideo } from "#native/media-player/load-video.function";
import { MediaPlayerSurface } from "#native/media-player/media-player-surface";
import type { MediaPlayerProps } from "#native/media-player/media-player.props";
import { Text } from "#native/text/text";

/** A video or audio file with the house controls. */
export function MediaPlayer(props: MediaPlayerProps): ReactElement {
  if (loadVideo()) return <MediaPlayerSurface {...props} />;
  return (
    <View
      className={`items-center justify-center rounded-[var(--radius-container)] border border-border bg-surface p-4 ${props.className ?? ""}`}
    >
      <Text tone="muted">{props.label}</Text>
    </View>
  );
}
