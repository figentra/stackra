/**
 * Stackra file contract:
 * Purpose: proves the native MediaPlayer drives an `expo-video` player: play and pause follow the player, the
 *          timeline speaks "0:12 of 1:05" and seeks by press and by VoiceOver's swipe, mute and volume, the speed
 *          menu, captions in the reader's language when the file carries them, full screen, `onEnded`, the poster,
 *          the left-to-right controls row, and the named frame where `expo-video` is missing.
 * Boundary: React Native does not render in vitest, so `react-native` is a small DOM stand-in, the controls are
 *           recording stand-ins and `expo-video` is a fake player that fires its own events.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement, useImperativeHandle, type ReactNode, type Ref } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { MediaPlayer } from "#native/media-player/media-player";

type Props = Record<string, unknown>;

const state = vi.hoisted(() => ({
  video: null as unknown,
  ranges: {} as Record<string, Record<string, unknown>>,
  menu: {} as Record<string, unknown>,
  fullscreen: vi.fn(),
}));

/** A fake `expo-video` player: settable properties and events the test fires. */
function fakePlayer() {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  return {
    playing: false,
    currentTime: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    subtitleTrack: null as unknown,
    timeUpdateEventInterval: 0,
    play: vi.fn(),
    pause: vi.fn(),
    addListener(name: string, listener: (payload: unknown) => void) {
      const set = listeners.get(name) ?? new Set();
      set.add(listener);
      listeners.set(name, set);
      return { remove: () => set.delete(listener) };
    },
    emit(name: string, payload?: unknown) {
      act(() => {
        for (const listener of listeners.get(name) ?? []) listener(payload);
      });
    },
  };
}

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
    View: (props: Props) => {
      if (props["accessibilityRole"] === "adjustable") {
        state.ranges[props["accessibilityLabel"] as string] = props;
        return h("div", {
          role: "slider",
          "aria-label": props["accessibilityLabel"],
          "aria-valuetext": (props["accessibilityValue"] as { text: string }).text,
        });
      }
      return h(
        "div",
        {
          role: props["role"],
          "aria-label": props["aria-label"],
          dir: (props["style"] as { direction?: string } | undefined)?.direction,
        },
        props["children"] as ReactNode,
      );
    },
    Pressable: (props: Props) =>
      h(
        "div",
        { role: "img", "aria-label": props["accessibilityLabel"], onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
    Image: () => h("img", { alt: "poster" }),
  };
});
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/media-player/media-player-icons.constant", () => ({ MEDIA_PLAYER_ICONS: {} }));
vi.mock("@stackra/icons/native", () => ({
  IconRegistryProvider: (props: { children: ReactNode }) => props.children,
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Props) =>
    createElement("button", {
      type: "button",
      "aria-label": props["label"],
      "aria-checked": (props["accessibilityState"] as { checked?: boolean } | undefined)?.checked,
      onClick: props["onPress"],
    }),
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Props) =>
    createElement("button", { type: "button", "aria-label": props["label"] }),
}));
vi.mock("#native/menu/menu", () => ({
  Menu: (props: Props) => {
    state.menu = props;
    return props["children"] as ReactNode;
  },
}));
vi.mock("#native/media-player/load-video.function", () => ({
  loadVideo: () => state.video,
}));

/** Installs a fake `expo-video` and gives its player. */
function withVideo() {
  const player = fakePlayer();
  state.video = {
    useVideoPlayer: (_src: string, setup: (created: typeof player) => void) => {
      setup(player);
      return player;
    },
    VideoView: ({ ref }: { ref: Ref<unknown> }) => {
      useImperativeHandle(ref, () => ({ enterFullscreen: state.fullscreen }));
      return null;
    },
  };
  return player;
}

/** The captions button, the one toggle among the buttons. */
const captions = () =>
  screen.getAllByRole("button").find((button) => button.hasAttribute("aria-checked"));
const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const range = (name: string) => state.ranges[name] as Record<string, (event: unknown) => void>;

afterEach(() => {
  state.video = null;
  state.ranges = {};
  state.fullscreen.mockReset();
});

describe("MediaPlayer (native)", () => {
  it("names a frame without expo-video", () => {
    render(<MediaPlayer src="clip.mp4" label="Store tour" />);
    expect(screen.getByText("Store tour")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("plays, pauses, shows the time and hides the poster once playing", () => {
    const player = withVideo();
    render(<MediaPlayer src="clip.mp4" label="Store tour" poster="still.jpg" />);
    expect(player.timeUpdateEventInterval).toBeGreaterThan(0);
    expect(screen.getByRole("group", { name: "Store tour" })).toBeTruthy();
    expect(screen.getByAltText("poster")).toBeTruthy();
    press("Play");
    expect(player.play).toHaveBeenCalled();
    player.playing = true;
    player.emit("playingChange", { isPlaying: true });
    expect(screen.queryByAltText("poster")).toBeNull();
    fireEvent.click(screen.getByRole("img", { name: "Store tour" }));
    expect(player.pause).toHaveBeenCalled();
    player.emit("sourceLoad", { duration: 65, availableSubtitleTracks: [] });
    player.emit("timeUpdate", { currentTime: 12, bufferedPosition: 30 });
    expect(screen.getByRole("slider", { name: "Seek" }).getAttribute("aria-valuetext")).toBe(
      "0:12 of 1:05",
    );
    expect(screen.getByText("0:12 / 1:05")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    // The controls row stays left to right in every language.
    expect(document.querySelector("[dir=ltr]")).toBeTruthy();
  });

  it("seeks by press and by an accessibility swipe, inside the file", () => {
    const player = withVideo();
    render(<MediaPlayer src="clip.mp4" label="Store tour" />);
    player.emit("sourceLoad", { duration: 65, availableSubtitleTracks: [] });
    act(() => range("Seek")["onLayout"]?.({ nativeEvent: { layout: { width: 200 } } }));
    act(() => range("Seek")["onResponderGrant"]?.({ nativeEvent: { locationX: 100 } }));
    expect(player.currentTime).toBe(32.5);
    act(() => range("Seek")["onResponderMove"]?.({ nativeEvent: { locationX: 400 } }));
    expect(player.currentTime).toBe(65);
    act(() =>
      range("Seek")["onAccessibilityAction"]?.({ nativeEvent: { actionName: "decrement" } }),
    );
    expect(player.currentTime).toBe(60);
    act(() =>
      range("Seek")["onAccessibilityAction"]?.({ nativeEvent: { actionName: "increment" } }),
    );
    expect(player.currentTime).toBe(65);
  });

  it("mutes, unmutes and sets the volume", () => {
    const player = withVideo();
    render(<MediaPlayer src="clip.mp4" label="Store tour" />);
    press("Mute");
    expect(player.muted).toBe(true);
    player.emit("mutedChange", { muted: true });
    expect(screen.getByRole("slider", { name: "Volume" }).getAttribute("aria-valuetext")).toBe(
      "0%",
    );
    press("Unmute");
    expect(player.muted).toBe(false);
    player.emit("mutedChange", { muted: false });
    act(() =>
      range("Volume")["onAccessibilityAction"]?.({ nativeEvent: { actionName: "decrement" } }),
    );
    expect(player.volume).toBe(0.9);
    player.emit("volumeChange", { volume: 0.9 });
    expect(screen.getByRole("slider", { name: "Volume" }).getAttribute("aria-valuetext")).toBe(
      "90%",
    );
  });

  it("changes the speed from the menu", () => {
    const player = withVideo();
    render(<MediaPlayer src="clip.mp4" label="Store tour" playbackRates={[1, 2]} />);
    const sections = state.menu["sections"] as { items: { label: string }[] }[];
    expect(sections[0]?.items.map((item) => item.label)).toEqual(["Normal", "2×"]);
    (state.menu["onAction"] as (id: string) => void)("2");
    expect(player.playbackRate).toBe(2);
    player.emit("playbackRateChange", { playbackRate: 2 });
    expect(screen.getByRole("button", { name: "Playback speed: 2×" })).toBeTruthy();
  });

  it("shows the file's captions in the reader's language", () => {
    const player = withVideo();
    render(
      <DesignSystemContext value={{ locale: "ar-SA", direction: "rtl" } as DesignSystemState}>
        <MediaPlayer src="clip.mp4" label="Store tour" />
      </DesignSystemContext>,
    );
    expect(screen.queryByRole("button", { name: /Captions|الترجمة/ })).toBeNull();
    const english = { id: "1", language: "en", label: "English" };
    const arabic = { id: "2", language: "ar", label: "العربية" };
    player.emit("availableSubtitleTracksChange", { availableSubtitleTracks: [english, arabic] });
    fireEvent.click(captions() as HTMLElement);
    expect(player.subtitleTrack).toBe(arabic);
    player.emit("subtitleTrackChange", { subtitleTrack: arabic });
    expect(captions()?.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(captions() as HTMLElement);
    expect(player.subtitleTrack).toBeNull();
  });

  it("goes full screen and reports the end", () => {
    const player = withVideo();
    const onEnded = vi.fn();
    render(<MediaPlayer src="clip.mp4" label="Store tour" onEnded={onEnded} />);
    press("Full screen");
    expect(state.fullscreen).toHaveBeenCalled();
    player.emit("playToEnd");
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("draws no picture and no full screen for audio", () => {
    withVideo();
    render(<MediaPlayer kind="audio" src="tone.m4a" label="Voice note" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("button", { name: "Full screen" })).toBeNull();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });
});
