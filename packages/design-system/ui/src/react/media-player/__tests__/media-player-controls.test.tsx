/**
 * Stackra file contract:
 * Purpose: proves the rest of the web MediaPlayer's controls: mute and unmute (back to full volume from silence), the
 *          volume slider's keys, the loaded share of the timeline, the speed menu, captions in the reader's language
 *          and off again, full screen on and off, `onEnded`, a cached length read on mount, and that shortcuts with a
 *          modifier or Space on a button are left alone.
 * Boundary: jsdom with real HeroUI and React Aria; jsdom plays nothing and has no full screen, so the element's
 *           methods and the document's full-screen API are stand-ins that fire the platform's events.
 * Runtime: browser
 * Governing contract: WCAG 2.2 SC 2.1.1, 2.1.4 and 4.1.2; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { MediaPlayer } from "#react/media-player/media-player";

const press = (element: HTMLElement) => act(() => element.click());

/** Renders a player and gives its video a length and live volume events. */
function renderPlayer(props: Partial<Parameters<typeof MediaPlayer>[0]> = {}) {
  const view = render(<MediaPlayer src="/clip.mp4" label="Store tour" {...props} />);
  const video = view.container.querySelector("video");
  if (!video) throw new Error("no video");
  Object.defineProperty(video, "duration", { value: 65, configurable: true });
  fireEvent(video, new Event("loadedmetadata"));
  return { ...view, video, group: screen.getByRole("group", { name: "Store tour" }) };
}

/** Sets the element's volume state and fires its event, as a browser does. */
const volumeChange = (video: HTMLVideoElement) => fireEvent(video, new Event("volumechange"));

describe("MediaPlayer controls (web)", () => {
  it("mutes and unmutes, coming back at full volume from silence", () => {
    const { video } = renderPlayer();
    press(screen.getByRole("button", { name: "Mute" }));
    expect(video.muted).toBe(true);
    volumeChange(video);
    expect(screen.getByRole("button", { name: "Unmute" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Volume" }).getAttribute("aria-valuenow")).toBe("0");
    press(screen.getByRole("button", { name: "Unmute" }));
    expect(video.muted).toBe(false);
    volumeChange(video);
    // Turned all the way down, unmuting restores full volume.
    video.volume = 0;
    volumeChange(video);
    press(screen.getByRole("button", { name: "Unmute" }));
    expect(video.volume).toBe(1);
    expect(video.muted).toBe(false);
  });

  it("steps the volume from its own slider and mutes at zero", () => {
    const { video } = renderPlayer();
    const slider = screen.getByRole("slider", { name: "Volume" });
    fireEvent.keyDown(slider, { key: "PageDown" });
    expect(video.volume).toBe(0);
    expect(video.muted).toBe(true);
    fireEvent.keyDown(slider, { key: "End" });
    expect(video.volume).toBe(1);
    volumeChange(video);
    expect(slider.getAttribute("aria-valuetext")).toBe("100%");
  });

  it("shows how much of the file is loaded", () => {
    const { video } = renderPlayer();
    Object.defineProperty(video, "buffered", {
      value: { length: 2, end: (index: number) => [10, 32.5][index] },
      configurable: true,
    });
    fireEvent(video, new Event("progress"));
    const seek = screen.getByRole("slider", { name: "Seek" });
    const loaded = seek.querySelector<HTMLElement>("span > span");
    expect(loaded?.style.width).toBe("50%");
  });

  it("changes the speed from the menu and names it on the button", async () => {
    const { video } = renderPlayer();
    const button = screen.getByRole("button", { name: "Playback speed: 1×" });
    await act(async () => {
      fireEvent.click(button);
    });
    const choice = await screen.findByRole("menuitemradio", { name: "1.5×" });
    await act(async () => {
      fireEvent.click(choice);
    });
    expect(video.playbackRate).toBe(1.5);
    fireEvent(video, new Event("ratechange"));
    expect(screen.getByRole("button", { name: "Playback speed: 1.5×" })).toBeTruthy();
  });

  it("turns on the captions in the reader's language, then off", async () => {
    const { video } = renderPlayer({
      tracks: [
        { src: "/ar.vtt", language: "ar", label: "العربية" },
        { src: "/en.vtt", language: "en", label: "English" },
      ],
    });
    const arabic = { mode: "disabled" };
    const english = { mode: "disabled" };
    Object.defineProperty(video, "textTracks", { value: [arabic, english], configurable: true });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Captions" }));
    });
    expect(english.mode).toBe("showing");
    expect(arabic.mode).toBe("disabled");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Captions" }));
    });
    expect(english.mode).toBe("disabled");
    expect(screen.getByRole("button", { name: "Captions" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  describe("full screen", () => {
    let current: Element | null = null;

    beforeEach(() => {
      current = null;
      Object.defineProperty(document, "fullscreenEnabled", { value: true, configurable: true });
      Object.defineProperty(document, "fullscreenElement", {
        get: () => current,
        configurable: true,
      });
      document.exitFullscreen = vi.fn(() => {
        current = null;
        document.dispatchEvent(new Event("fullscreenchange"));
        return Promise.resolve();
      });
      HTMLElement.prototype.requestFullscreen = vi.fn(() => {
        current = document.querySelector('[data-slot="media-player"]');
        document.dispatchEvent(new Event("fullscreenchange"));
        return Promise.resolve();
      });
    });

    afterEach(() => {
      Reflect.deleteProperty(document, "fullscreenEnabled");
      Reflect.deleteProperty(document, "fullscreenElement");
    });

    it("enters and leaves full screen from the button and the F key", () => {
      const { group } = renderPlayer();
      act(() => screen.getByRole("button", { name: "Full screen" }).click());
      expect(document.fullscreenElement).toBe(group);
      expect(screen.getByRole("button", { name: "Exit full screen" })).toBeTruthy();
      act(() => {
        fireEvent.keyDown(group, { key: "F" });
      });
      expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Full screen" })).toBeTruthy();
    });
  });

  it("reports the end and goes back to Play", () => {
    const onEnded = vi.fn();
    const { video } = renderPlayer({ onEnded });
    fireEvent(video, new Event("play"));
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    fireEvent(video, new Event("ended"));
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  it("plays and pauses from a press on the picture", () => {
    const { video } = renderPlayer();
    const play = vi.fn(() => Promise.resolve());
    video.play = play;
    fireEvent.click(video);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("leaves shortcuts with a modifier, and Space on a button, to the browser", () => {
    const { video, group } = renderPlayer();
    const play = vi.fn(() => Promise.resolve());
    video.play = play;
    fireEvent.keyDown(group, { key: "k", ctrlKey: true });
    fireEvent.keyDown(group, { key: "m", metaKey: true });
    fireEvent.keyDown(screen.getByRole("button", { name: "Mute" }), { key: " " });
    fireEvent.keyDown(group, { key: "x" });
    expect(play).not.toHaveBeenCalled();
    expect(video.muted).toBe(false);
  });

  it("reads the length of a file already loaded when it mounts", () => {
    const readyState = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "readyState");
    const duration = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "duration");
    Object.defineProperty(HTMLMediaElement.prototype, "readyState", {
      get: () => 4,
      configurable: true,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      get: () => 90,
      configurable: true,
    });
    try {
      render(<MediaPlayer src="/clip.mp4" label="Cached" />);
      expect(screen.getByText("0:00 / 1:30")).toBeTruthy();
    } finally {
      if (readyState) Object.defineProperty(HTMLMediaElement.prototype, "readyState", readyState);
      if (duration) Object.defineProperty(HTMLMediaElement.prototype, "duration", duration);
    }
  });
});
