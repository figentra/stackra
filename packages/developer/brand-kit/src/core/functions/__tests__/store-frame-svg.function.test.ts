/**
 * Stackra file contract:
 * Purpose: unit tests of `storeFrameSvg`: the canvas size of the frame, the caption escaped, right-to-left text and the
 *          Arabic family for Arabic, and the screenshot embedded when there is one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended: D19).
 */
import { describe, expect, it } from "@stackra/testing";
import { STACKRA_THEME } from "@stackra/tokens";

import { DEVICE_FRAMES } from "#core/constants/device-frames.constant";
import { storeFrameSvg } from "#core/functions/store-frame-svg.function";

const frame = DEVICE_FRAMES[0] ?? { id: "ios_phone", width: 1320, height: 2868, radius: 96 };

describe("storeFrameSvg", () => {
  it("draws the escaped caption on the frame's canvas", () => {
    const svg = storeFrameSvg({
      theme: STACKRA_THEME,
      frame,
      locale: "en",
      caption: "Size & <fit>",
    });
    expect(svg).toContain(`width="${frame.width}" height="${frame.height}"`);
    expect(svg).toContain("Size &amp; &lt;fit&gt;");
    expect(svg).not.toContain("<image");
    expect(svg).not.toContain('direction="rtl"');
  });

  it("sets Arabic right to left and embeds the screenshot", () => {
    const svg = storeFrameSvg({
      theme: STACKRA_THEME,
      frame,
      locale: "ar",
      caption: "مقاس",
      screenshot: new Uint8Array([1, 2, 3]),
    });
    expect(svg).toContain('direction="rtl"');
    expect(svg).toContain("data:image/png;base64,AQID");
  });
});
