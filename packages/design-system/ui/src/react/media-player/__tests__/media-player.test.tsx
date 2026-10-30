/**
 * Stackra file contract:
 * Purpose: proves the web MediaPlayer is a named group over a `<video>` or `<audio>`: play and pause follow the
 *          element, the timeline speaks "0:12 of 1:05" and seeks, the shortcuts (Space, ←/→, ↑/↓, M) drive the
 *          element, the captions button shows only with tracks and turns the first one on, and the controls row is
 *          left to right.
 * Boundary: jsdom with real HeroUI; jsdom plays nothing, so `play`, `pause` and the length are stubs that fire the
 *           element's own events.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { MediaPlayer } from "#react/media-player/media-player";

/** Gives the element a length and makes play and pause fire their events. */
function stub(media: HTMLMediaElement, length = 65) {
  const element = media;
  Object.defineProperty(element, "duration", { value: length, configurable: true });
  let paused = true;
  Object.defineProperty(element, "paused", { get: () => paused, configurable: true });
  element.play = () => {
    paused = false;
    fireEvent(element, new Event("play"));
    return Promise.resolve();
  };
  element.pause = () => {
    paused = true;
    fireEvent(element, new Event("pause"));
  };
  fireEvent(element, new Event("loadedmetadata"));
}

describe("MediaPlayer (web)", () => {
  it("plays, pauses and speaks the time", () => {
    const { container } = render(<MediaPlayer src="/clip.mp4" label="Store tour" />);
    const video = container.querySelector("video");
    if (!video) throw new Error("no video");
    stub(video);
    expect(screen.getByRole("group", { name: "Store tour" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    video.currentTime = 12;
    fireEvent(video, new Event("timeupdate"));
    expect(screen.getByRole("slider", { name: "Seek" }).getAttribute("aria-valuetext")).toBe(
      "0:12 of 1:05",
    );
    expect(screen.getByText("0:12 / 1:05")).toBeTruthy();
    expect(container.querySelector("[dir=ltr]")).toBeTruthy();
  });

  it("drives the element from the keyboard", () => {
    const { container } = render(<MediaPlayer src="/clip.mp4" label="Store tour" />);
    const video = container.querySelector("video");
    if (!video) throw new Error("no video");
    stub(video);
    const group = screen.getByRole("group", { name: "Store tour" });
    fireEvent.keyDown(group, { key: " " });
    expect(video.paused).toBe(false);
    video.currentTime = 20;
    fireEvent(video, new Event("timeupdate"));
    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(video.currentTime).toBe(15);
    fireEvent.keyDown(group, { key: "ArrowDown" });
    expect(video.volume).toBeCloseTo(0.9);
    fireEvent.keyDown(group, { key: "m" });
    expect(video.muted).toBe(true);
    fireEvent.keyDown(group, { key: "k" });
    expect(video.paused).toBe(true);
  });

  it("seeks from the timeline's own keys only once", () => {
    const { container } = render(<MediaPlayer src="/clip.mp4" label="Store tour" />);
    const video = container.querySelector("video");
    if (!video) throw new Error("no video");
    stub(video);
    fireEvent.keyDown(screen.getByRole("slider", { name: "Seek" }), { key: "End" });
    expect(video.currentTime).toBe(65);
  });

  it("offers captions only with tracks and turns the first on", async () => {
    const { container, rerender } = render(<MediaPlayer src="/clip.mp4" label="Tour" />);
    expect(screen.queryByRole("button", { name: "Captions" })).toBeNull();
    rerender(
      <MediaPlayer
        src="/clip.mp4"
        label="Tour"
        tracks={[{ src: "/ar.vtt", language: "ar", label: "العربية" }]}
      />,
    );
    const video = container.querySelector("video");
    if (!video) throw new Error("no video");
    const track = { mode: "disabled" };
    Object.defineProperty(video, "textTracks", {
      value: Object.assign([track], {}),
      configurable: true,
    });
    const button = screen.getByRole("button", { name: "Captions" });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(track.mode).toBe("showing");
    expect(screen.getByRole("button", { name: "Captions" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("draws an audio element for audio, with no full screen", () => {
    const { container } = render(<MediaPlayer kind="audio" src="/tone.wav" label="Voice note" />);
    expect(container.querySelector("audio")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Full screen" })).toBeNull();
  });
});
