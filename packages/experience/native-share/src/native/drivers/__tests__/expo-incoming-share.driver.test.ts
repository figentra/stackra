/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoIncomingShareDriver`: expo-sharing's raw payloads become shared items (text, link,
 *          file with its decoded name), `clear` clears them, a file is read from its URI, and subscribers hear each
 *          return to the foreground only.
 * Boundary: test only; expo-sharing and react-native are mocked, `fetch` is stubbed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0478 (decision 9).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ExpoIncomingShareDriver } from "#native/drivers/expo-incoming-share.driver";

const mocks = vi.hoisted(() => ({
  payloads: [] as { value: string; shareType: string; mimeType?: string }[],
  clear: vi.fn(),
  appState: null as ((state: string) => void) | null,
  remove: vi.fn(),
}));

vi.mock("expo-sharing", () => ({
  getSharedPayloads: () => mocks.payloads,
  clearSharedPayloads: mocks.clear,
}));

vi.mock("react-native", () => ({
  AppState: {
    addEventListener: (_event: string, handler: (state: string) => void) => {
      mocks.appState = handler;
      return { remove: mocks.remove };
    },
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ExpoIncomingShareDriver", () => {
  it("maps the raw payloads and keeps what the configuration accepts", async () => {
    mocks.payloads = [
      { value: "hello", shareType: "text" },
      { value: "https://example.com", shareType: "url" },
      { value: "file:///group/My%20Scan.pdf", shareType: "file", mimeType: "application/pdf" },
      { value: "file:///group/clip.mov", shareType: "video", mimeType: "video/quicktime" },
    ];
    expect(await new ExpoIncomingShareDriver().pending()).toEqual([
      { kind: "text", value: "hello", mimeType: "text/plain", name: null },
      { kind: "url", value: "https://example.com", mimeType: "text/plain", name: null },
      {
        kind: "file",
        value: "file:///group/My%20Scan.pdf",
        mimeType: "application/pdf",
        name: "My Scan.pdf",
      },
    ]);
  });

  it("reads a file from its URI and clears through expo-sharing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("%PDF")),
    );
    const share = new ExpoIncomingShareDriver();
    const item = {
      kind: "file",
      value: "file:///a.pdf",
      mimeType: "application/pdf",
      name: "a.pdf",
    } as const;
    expect(await (await share.read(item))?.text()).toBe("%PDF");
    await share.clear();
    expect(mocks.clear).toHaveBeenCalledOnce();
  });

  it("reads a file that is gone as null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("gone");
      }),
    );
    const item = {
      kind: "file",
      value: "file:///a.pdf",
      mimeType: "application/pdf",
      name: "a.pdf",
    } as const;
    expect(await new ExpoIncomingShareDriver().read(item)).toBeNull();
  });

  it("tells subscribers when the app becomes active", () => {
    const listener = vi.fn();
    const unsubscribe = new ExpoIncomingShareDriver().subscribe(listener);
    mocks.appState?.("background");
    mocks.appState?.("active");
    unsubscribe();
    expect(listener).toHaveBeenCalledOnce();
    expect(mocks.remove).toHaveBeenCalledOnce();
  });
});
