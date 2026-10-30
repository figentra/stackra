/**
 * Stackra file contract:
 * Purpose: proves the MediaPlayer helpers both platforms share: `mediaSeekOf` keeps a seek inside the file,
 *          `mediaShareOf` measures a track, `mediaVolumeOf` clamps and rounds, `mediaMuteToggleOf` unmutes a silent
 *          player at a hearable volume, and `captionIndexOf` picks the reader's language, else the first track.
 * Boundary: pure functions.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { captionIndexOf } from "#core/functions/caption-index-of.function";
import { mediaMuteToggleOf } from "#core/functions/media-mute-toggle-of.function";
import { mediaShareOf } from "#core/functions/media-share-of.function";
import { mediaSeekOf } from "#core/functions/media-seek-of.function";
import { mediaVolumeOf } from "#core/functions/media-volume-of.function";

describe("MediaPlayer helpers", () => {
  it("keeps a seek inside the file", () => {
    expect(mediaSeekOf(-3, 65)).toBe(0);
    expect(mediaSeekOf(70, 65)).toBe(65);
    expect(mediaSeekOf(12, 65)).toBe(12);
    expect(mediaSeekOf(12, Number.NaN)).toBe(0);
  });

  it("measures the filled share of a track", () => {
    expect(mediaShareOf(13, 65)).toBe(0.2);
    expect(mediaShareOf(80, 65)).toBe(1);
    expect(mediaShareOf(5, 0)).toBe(0);
  });

  it("clamps and rounds the volume", () => {
    expect(mediaVolumeOf(0.1 + 0.2)).toBe(0.3);
    expect(mediaVolumeOf(1.2)).toBe(1);
    expect(mediaVolumeOf(-0.1)).toBe(0);
  });

  it("toggles mute so an unmuted player is hearable", () => {
    expect(mediaMuteToggleOf({ volume: 0.6, isMuted: false })).toEqual({
      volume: 0.6,
      isMuted: true,
    });
    expect(mediaMuteToggleOf({ volume: 0.6, isMuted: true })).toEqual({
      volume: 0.6,
      isMuted: false,
    });
    expect(mediaMuteToggleOf({ volume: 0, isMuted: false })).toEqual({ volume: 1, isMuted: false });
  });

  it("picks the reader's captions, else the first", () => {
    expect(captionIndexOf(["en", "ar"], "ar-SA")).toBe(1);
    expect(captionIndexOf(["en", "ar"], "fr")).toBe(0);
    expect(captionIndexOf([], "ar")).toBe(0);
    // A two-letter locale never matches a longer language that merely starts with it.
    expect(captionIndexOf(["en", "ar"], "a")).toBe(0);
  });

  it.each([
    ["ara", "ar-SA"],
    ["eng", "en-US"],
    ["deu", "de"],
    ["ger", "de-DE"],
    ["spa", "es"],
    ["fra", "fr-FR"],
    ["fre", "fr"],
    ["ita", "it"],
    ["nld", "nl-NL"],
    ["dut", "nl"],
  ])("matches the ISO 639-2 code %s to the %s reader", (code, locale) => {
    expect(captionIndexOf(["xxx", code], locale)).toBe(1);
    expect(captionIndexOf(["xxx", code.toUpperCase()], locale)).toBe(1);
  });

  it("matches an unknown three-letter code only to itself", () => {
    expect(captionIndexOf(["eng", "jpn"], "jpn")).toBe(1);
    expect(captionIndexOf(["eng", "jpn"], "ja")).toBe(0);
  });
});
