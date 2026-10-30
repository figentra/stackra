/**
 * Stackra file contract:
 * Purpose: the web `MediaPlayer`: the browser's `<video>` or `<audio>` with the house controls under it: play and
 *          pause, a timeline showing what is loaded, the time ("0:12 / 1:05" in the customer's digits), mute and
 *          volume, a speed menu, captions (when there are tracks) and full screen (video). The player is one named,
 *          focusable group with the usual shortcuts: Space or K play and pause, ←/→ five seconds back and forward,
 *          ↑/↓ the volume, M mute, F full screen.
 * Boundary: the platform element plays; this draws controls only. The controls row and timeline are left to right in
 *           every language (the media convention of YouTube and the system players) and no icon mirrors; the names
 *           and the speed menu speak the locale. A shortcut pressed on a button or inside the speed menu is left to
 *           them. Nothing animates.
 * Runtime: browser
 * Governing contract: WCAG 2.2 SC 1.2.2, 2.1.1, 2.1.4 and 4.1.2; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { MEDIA_PLAYER_STEPS } from "#core/constants/media-player-steps.constant";
import { captionIndexOf } from "#core/functions/caption-index-of.function";
import { mediaMuteToggleOf } from "#core/functions/media-mute-toggle-of.function";
import { mediaSeekOf } from "#core/functions/media-seek-of.function";
import { mediaVolumeOf } from "#core/functions/media-volume-of.function";
import { Button } from "#react/button/button";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useMediaPlayerState } from "#react/hooks/use-media-player-state";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { MEDIA_PLAYER_ICONS } from "#react/media-player/media-player-icons.constant";
import type { MediaPlayerProps } from "#react/media-player/media-player.props";
import { MediaRange } from "#react/media-player/media-range";
import { Menu } from "#react/menu/menu";

/** The seconds an arrow seeks and the volume an arrow moves, shared with the native player. */
const { seekSeconds: SEEK_SECONDS, volumeStep: VOLUME_STEP } = MEDIA_PLAYER_STEPS;

/** A video or audio file with the house controls. */
export function MediaPlayer({
  src,
  kind = "video",
  label,
  poster,
  tracks,
  playbackRates = MEDIA_PLAYER_STEPS.rates,
  onEnded,
  className,
}: MediaPlayerProps): ReactElement {
  const { locale } = useLocale();
  const format = useNumberFormat();
  const player = useMediaPlayerState(playbackRates, format);
  const { time, duration, volume, hasCaptions } = player.state;
  const patch = player.patch;
  const root = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isVideo = kind === "video";
  const canFullscreen = isVideo && typeof document !== "undefined" && document.fullscreenEnabled;

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // A cached file can have its metadata before the listeners see it, so read the length once on mount.
  useEffect(() => {
    const ready = media.current;
    if (ready && ready.readyState >= 1 && Number.isFinite(ready.duration))
      patch({ duration: ready.duration });
    // oxlint-disable-next-line react/exhaustive-deps -- reason: once on mount; `patch` only merges into the state
  }, []);

  const element = () => media.current;
  const togglePlay = () => {
    const playing = element();
    if (!playing) return;
    // A refused play (autoplay rules, a missing file) leaves the button on "Play"; nothing else to do.
    if (playing.paused) playing.play()?.catch(() => undefined);
    else playing.pause();
  };
  const seek = (to: number) => {
    const playing = element();
    if (playing) playing.currentTime = mediaSeekOf(to, duration);
  };
  const changeVolume = (to: number) => {
    const playing = element();
    if (!playing) return;
    playing.volume = mediaVolumeOf(to);
    playing.muted = playing.volume === 0;
  };
  const toggleMute = () => {
    const playing = element();
    if (!playing) return;
    const next = mediaMuteToggleOf({ volume: playing.volume, isMuted: playing.muted });
    playing.volume = next.volume;
    playing.muted = next.isMuted;
  };
  const toggleFullscreen = () => {
    if (!canFullscreen) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen();
  };
  const toggleCaptions = () => {
    const list = element()?.textTracks;
    if (!list || list.length === 0) return;
    const next = !hasCaptions;
    // The track in the reader's language, else the first.
    const shown = captionIndexOf(tracks?.map((track) => track.language) ?? [], locale);
    for (let index = 0; index < list.length; index += 1) {
      const track = list[index];
      if (track) track.mode = next && index === shown ? "showing" : "disabled";
    }
    patch({ hasCaptions: next });
  };
  const shortcuts: Readonly<Record<string, () => void>> = {
    " ": togglePlay,
    k: togglePlay,
    ArrowLeft: () => seek(time - SEEK_SECONDS),
    ArrowRight: () => seek(time + SEEK_SECONDS),
    ArrowUp: () => changeVolume(volume + VOLUME_STEP),
    ArrowDown: () => changeVolume(volume - VOLUME_STEP),
    m: toggleMute,
    f: toggleFullscreen,
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    // A key inside the speed menu (a portal) or on a button belongs to them.
    if (!root.current?.contains(target) || event.metaKey || event.ctrlKey || event.altKey) return;
    if ((event.key === " " || event.key === "Enter") && target.closest("button")) return;
    const run = shortcuts[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (!run) return;
    event.preventDefault();
    run();
  };

  const events = {
    onPlay: () => patch({ isPlaying: true }),
    onPause: () => patch({ isPlaying: false }),
    onEnded: () => {
      patch({ isPlaying: false });
      onEnded?.();
    },
    onTimeUpdate: () => patch({ time: element()?.currentTime ?? 0 }),
    onLoadedMetadata: () => patch({ duration: element()?.duration ?? 0 }),
    onDurationChange: () => patch({ duration: element()?.duration ?? 0 }),
    onProgress: () => {
      const ranges = element()?.buffered;
      patch({ buffered: ranges && ranges.length > 0 ? ranges.end(ranges.length - 1) : 0 });
    },
    onVolumeChange: () => {
      patch({ volume: element()?.volume ?? 1, isMuted: element()?.muted ?? false });
    },
    onRateChange: () => patch({ rate: element()?.playbackRate ?? 1 }),
  };

  return (
    <IconRegistryProvider registry={MEDIA_PLAYER_ICONS}>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- reason: the player's shortcuts (Space, K, arrows, M, F) bubble from its controls and from the focused player, as in every media player */}
      <div
        ref={root}
        role="group"
        aria-label={label}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: the player itself takes focus so its shortcuts work before any control is reached (WCAG 2.1.1)
        tabIndex={0}
        onKeyDown={onKeyDown}
        data-slot="media-player"
        className={cn(
          "flex w-full flex-col overflow-hidden bg-surface outline-none focus-visible:ring-2 focus-visible:ring-focus",
          isFullscreen ? "h-full" : "border border-border",
          className,
        )}
        style={isFullscreen ? undefined : { borderRadius: "var(--radius-container)" }}
      >
        {isVideo ? (
          // The controls below caption the video; a press on the picture plays and pauses, as in every player.
          // oxlint-disable-next-line jsx-a11y/media-has-caption -- captions come from `tracks` when the file has them.
          <video
            ref={media}
            src={src}
            {...(poster === undefined ? {} : { poster })}
            playsInline
            preload="metadata"
            onClick={togglePlay}
            className={cn(
              "w-full bg-black object-contain",
              isFullscreen ? "min-h-0 flex-1" : "aspect-video",
            )}
            {...events}
          >
            {tracks?.map((track) => (
              <track
                key={track.src}
                kind="captions"
                src={track.src}
                srcLang={track.language}
                label={track.label}
              />
            ))}
          </video>
        ) : (
          // oxlint-disable-next-line jsx-a11y/media-has-caption -- audio carries no captions track.
          <audio ref={media} src={src} preload="metadata" {...events} />
        )}
        <div dir="ltr" className="flex flex-col gap-1 px-3 pt-2 pb-2">
          <MediaRange
            value={time}
            max={duration || 0}
            buffered={player.state.buffered}
            label={player.seekLabel}
            valueText={player.seekText}
            step={SEEK_SECONDS}
            onChange={seek}
          />
          <div className="flex items-center gap-1">
            <IconButton
              icon={<Icon name={player.state.isPlaying ? "pause" : "play"} />}
              label={player.playLabel}
              variant="ghost"
              size="sm"
              onPress={togglePlay}
            />
            <IconButton
              icon={<Icon name={player.isSilent ? "volume-x" : "volume-2"} />}
              label={player.muteLabel}
              variant="ghost"
              size="sm"
              onPress={toggleMute}
            />
            <MediaRange
              value={player.shownVolume}
              max={1}
              label={player.volumeLabel}
              valueText={player.volumeText}
              step={VOLUME_STEP}
              onChange={changeVolume}
              className="w-20"
            />
            <span className="ms-2 text-xs whitespace-nowrap text-muted tabular-nums">
              {player.timeText}
            </span>
            <span className="flex-1" />
            <Menu
              sections={player.speedSections}
              selectionMode="single"
              value={[String(player.state.rate)]}
              onAction={(id) => {
                const playing = element();
                if (playing) playing.playbackRate = Number(id);
              }}
            >
              <Button variant="ghost" size="sm" label={player.speedLabel}>
                <span className="tabular-nums">{player.speedText}</span>
              </Button>
            </Menu>
            {tracks?.length ? (
              <IconButton
                icon={<Icon name={hasCaptions ? "captions" : "captions-off"} />}
                label={player.captionsLabel}
                aria-pressed={hasCaptions}
                variant="ghost"
                size="sm"
                onPress={toggleCaptions}
              />
            ) : null}
            {canFullscreen ? (
              <IconButton
                icon={<Icon name={isFullscreen ? "minimize" : "maximize"} />}
                label={player.fullscreenLabel(isFullscreen)}
                variant="ghost"
                size="sm"
                onPress={toggleFullscreen}
              />
            ) : null}
          </div>
        </div>
      </div>
    </IconRegistryProvider>
  );
}
