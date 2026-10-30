/**
 * Stackra file contract:
 * Purpose: the native MediaPlayer's `MediaPlayerSurface`: an `expo-video` player with the house controls under it:
 *          play and pause, a timeline showing what is loaded, the time ("0:12 / 1:05" in the customer's digits), mute
 *          and volume, a speed menu, captions (when the file carries any) and full screen (video). A press on the
 *          picture plays and pauses, as in every player.
 * Boundary: internal; `MediaPlayer` renders it once `expo-video` is found, so its hooks always run. The platform
 *           player plays and full screen is the system's; this draws controls only. `expo-video` cannot load a
 *           separate WebVTT file, so on native the captions are the ones the file itself carries (an HLS stream's or
 *           an MP4's subtitle tracks) and `tracks` is not read; the one in the reader's language is shown, else the
 *           first. The controls row and timeline are left to right in every language and no icon mirrors; the names
 *           and the speed menu speak the locale. Nothing animates, so there is no motion to reduce.
 * Runtime: react-native
 * Governing contract: WCAG 2.2 SC 1.2.2 and 4.1.2; ADR 0302 (decision 3); STA-1371 (owner approval 2026-10-30).
 */
import { IconRegistryProvider } from "@stackra/icons/native";
import type * as ExpoVideo from "expo-video";
import type { SubtitleTrack, VideoPlayer, VideoView } from "expo-video";
import { use, useEffect, useRef, useState, type ReactElement } from "react";
import { Image, Pressable, View } from "react-native";

import { MEDIA_PLAYER_STEPS } from "#core/constants/media-player-steps.constant";
import { captionIndexOf } from "#core/functions/caption-index-of.function";
import { mediaMuteToggleOf } from "#core/functions/media-mute-toggle-of.function";
import { mediaSeekOf } from "#core/functions/media-seek-of.function";
import { mediaVolumeOf } from "#core/functions/media-volume-of.function";
import { useMediaPlayerState } from "#react/hooks/use-media-player-state";
import { Button } from "#native/button/button";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { MEDIA_PLAYER_ICONS } from "#native/media-player/media-player-icons.constant";
import { loadVideo } from "#native/media-player/load-video.function";
import type { MediaPlayerProps } from "#native/media-player/media-player.props";
import { MediaRange } from "#native/media-player/media-range";
import { Menu } from "#native/menu/menu";
import { Text } from "#native/text/text";

/** How often, in seconds, the player reports its time. */
const TICK_SECONDS = 0.25;

/** What the controls set on the player. */
type PlayerPatch = Partial<
  Pick<
    VideoPlayer,
    | "currentTime"
    | "volume"
    | "muted"
    | "playbackRate"
    | "subtitleTrack"
    | "timeUpdateEventInterval"
  >
>;

/** Sets the player's own properties: it is a native object the controls drive, not React state. */
const command = (player: VideoPlayer, patch: PlayerPatch) => Object.assign(player, patch);

/** The controls over an `expo-video` player. */
export function MediaPlayerSurface({
  src,
  kind = "video",
  label,
  poster,
  playbackRates = MEDIA_PLAYER_STEPS.rates,
  onEnded,
  className,
}: MediaPlayerProps): ReactElement {
  // `MediaPlayer` mounts this surface only once `loadVideo()` has found the module, which never changes after.
  const video = loadVideo() as typeof ExpoVideo;
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const media = useMediaPlayerState(playbackRates, useNumberFormat());
  const patch = media.patch;
  const view = useRef<VideoView>(null);
  // oxlint-disable-next-line react/hooks -- reason: `video` is the module `loadVideo()` found, the same one on every render; `MediaPlayer` mounts this surface only when it is there
  const player = video.useVideoPlayer(src, (created) =>
    command(created, { timeUpdateEventInterval: TICK_SECONDS }),
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [subtitles, setSubtitles] = useState<readonly SubtitleTrack[]>([]);
  const isVideo = kind === "video";

  useEffect(() => {
    const subscriptions = [
      player.addListener("playingChange", ({ isPlaying: playing }) => {
        patch({ isPlaying: playing });
        if (playing) setHasStarted(true);
      }),
      player.addListener("timeUpdate", ({ currentTime, bufferedPosition }) => {
        patch({ time: currentTime, buffered: Math.max(0, bufferedPosition) });
      }),
      player.addListener("sourceLoad", (loaded) => {
        patch({ duration: loaded.duration });
        setSubtitles(loaded.availableSubtitleTracks);
      }),
      player.addListener("availableSubtitleTracksChange", ({ availableSubtitleTracks }) =>
        setSubtitles(availableSubtitleTracks),
      ),
      player.addListener("subtitleTrackChange", ({ subtitleTrack }) =>
        patch({ hasCaptions: subtitleTrack !== null }),
      ),
      player.addListener("volumeChange", (next) => patch({ volume: next.volume })),
      player.addListener("mutedChange", (next) => patch({ isMuted: next.muted })),
      player.addListener("playbackRateChange", (next) => patch({ rate: next.playbackRate })),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.remove();
    };
    // oxlint-disable-next-line react/exhaustive-deps -- reason: `patch` only merges into the state, so the listeners follow the player alone
  }, [player]);

  useEffect(() => {
    if (!onEnded) return;
    const subscription = player.addListener("playToEnd", onEnded);
    return () => subscription.remove();
  }, [player, onEnded]);

  const togglePlay = () => {
    if (player.playing) player.pause();
    else player.play();
  };
  const seek = (to: number) => {
    command(player, { currentTime: mediaSeekOf(to, media.state.duration) });
    patch({ time: player.currentTime });
  };
  const changeVolume = (to: number) => {
    const next = mediaVolumeOf(to);
    command(player, { volume: next, muted: next === 0 });
  };
  const toggleMute = () => {
    const next = mediaMuteToggleOf({ volume: player.volume, isMuted: player.muted });
    command(player, { volume: next.volume, muted: next.isMuted });
  };
  const toggleCaptions = () => {
    const shown =
      subtitles[
        captionIndexOf(
          subtitles.map((track) => track.language),
          locale,
        )
      ];
    command(player, { subtitleTrack: media.state.hasCaptions ? null : (shown ?? null) });
  };

  return (
    <IconRegistryProvider registry={MEDIA_PLAYER_ICONS}>
      <View
        role="group"
        aria-label={label}
        className={`w-full overflow-hidden rounded-[var(--radius-container)] border border-border bg-surface ${className ?? ""}`}
      >
        {isVideo ? (
          <Pressable
            accessible
            accessibilityRole="image"
            accessibilityLabel={label}
            onPress={togglePlay}
            className="aspect-video w-full bg-black"
          >
            <video.VideoView
              ref={view}
              player={player}
              nativeControls={false}
              contentFit="contain"
              style={{ flex: 1 }}
            />
            {poster !== undefined && !hasStarted ? (
              <Image
                source={{ uri: poster }}
                resizeMode="contain"
                className="absolute inset-0"
                accessibilityIgnoresInvertColors
              />
            ) : null}
          </Pressable>
        ) : null}
        <View className="gap-1 px-3 pt-2 pb-2" style={{ direction: "ltr" }}>
          {/* The time sits beside the timeline, as a phone's row has no room for it among the buttons. */}
          <View className="flex-row items-center gap-3">
            <MediaRange
              value={media.state.time}
              max={media.state.duration}
              buffered={media.state.buffered}
              label={media.seekLabel}
              valueText={media.seekText}
              step={MEDIA_PLAYER_STEPS.seekSeconds}
              onChange={seek}
              className="flex-1"
            />
            <Text type="small" tone="muted" style={{ fontVariant: ["tabular-nums"] }}>
              {media.timeText}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <IconButton
              icon={<Icon name={media.state.isPlaying ? "pause" : "play"} />}
              label={media.playLabel}
              variant="ghost"
              size="sm"
              onPress={togglePlay}
            />
            <IconButton
              icon={<Icon name={media.isSilent ? "volume-x" : "volume-2"} />}
              label={media.muteLabel}
              variant="ghost"
              size="sm"
              onPress={toggleMute}
            />
            <MediaRange
              value={media.shownVolume}
              max={1}
              label={media.volumeLabel}
              valueText={media.volumeText}
              step={MEDIA_PLAYER_STEPS.volumeStep}
              onChange={changeVolume}
              className="w-16"
            />
            <View className="flex-1" />
            <Menu
              sections={media.speedSections}
              selectionMode="single"
              value={[String(media.state.rate)]}
              onAction={(id) => {
                command(player, { playbackRate: Number(id) });
              }}
            >
              <Button variant="ghost" size="sm" label={media.speedLabel}>
                {media.speedText}
              </Button>
            </Menu>
            {subtitles.length > 0 ? (
              <IconButton
                icon={<Icon name={media.state.hasCaptions ? "captions" : "captions-off"} />}
                label={media.captionsLabel}
                accessibilityState={{ checked: media.state.hasCaptions }}
                variant="ghost"
                size="sm"
                onPress={toggleCaptions}
              />
            ) : null}
            {isVideo ? (
              <IconButton
                icon={<Icon name="maximize" />}
                label={media.fullscreenLabel(false)}
                variant="ghost"
                size="sm"
                onPress={() => void view.current?.enterFullscreen()}
              />
            ) : null}
          </View>
        </View>
      </View>
    </IconRegistryProvider>
  );
}
