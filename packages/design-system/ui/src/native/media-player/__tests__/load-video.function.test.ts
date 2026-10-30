/**
 * Stackra file contract:
 * Purpose: proves the native loadVideo: with no linked `ExpoVideo` native module it gives `null` without requiring the
 *          package, and with one linked it never throws, giving the module or `null`.
 * Boundary: the function only; `globalThis.expo` is stubbed per test and no native module runs.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (owner approval 2026-10-30).
 */
import { loadVideo } from "#native/media-player/load-video.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadVideo (native)", () => {
  it("gives null where the native module is not linked", () => {
    vi.stubGlobal("expo", undefined);
    expect(loadVideo()).toBeNull();
    vi.stubGlobal("expo", { modules: {} });
    expect(loadVideo()).toBeNull();
  });

  it("never throws where the native module is linked", () => {
    vi.stubGlobal("expo", { modules: { ExpoVideo: {} } });
    const video = loadVideo();
    expect(video === null || typeof video.useVideoPlayer === "function").toBe(true);
  });
});
