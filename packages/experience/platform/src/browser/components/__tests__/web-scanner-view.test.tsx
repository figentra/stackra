/**
 * Stackra file contract:
 * Purpose: unit tests of `WebScannerView`: it renders a muted inline video, opens the rear camera, hands a decoded code
 *          to `onBarcode`, and stops the camera on unmount; without a detector it opens nothing.
 * Boundary: test only; jsdom with `BarcodeDetector`, `getUserMedia` and video playback stubbed.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0250 (decision 2).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { WebScannerView } from "#browser/components/web-scanner-view";

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "mediaDevices");
});

describe("WebScannerView", () => {
  it("decodes from the rear camera and stops it on unmount", async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop }] }));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    vi.stubGlobal(
      "BarcodeDetector",
      class {
        async detect() {
          return [{ rawValue: "6281000000012" }];
        }
      },
    );
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(4);
    const onBarcode = vi.fn();
    const view = render(<WebScannerView formats={["ean13"]} onBarcode={onBarcode} />);
    const video = screen.getByTestId("scanner-view") as HTMLVideoElement;
    expect(video.muted).toBe(true);
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
      audio: false,
    });
    await vi.waitFor(() => expect(onBarcode).toHaveBeenCalledWith("6281000000012"));
    view.unmount();
    expect(stop).toHaveBeenCalled();
  });

  it("opens no camera without a detector", () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    render(<WebScannerView onBarcode={vi.fn()} />);
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
