/**
 * Stackra file contract:
 * Purpose: unit tests of `sharingPluginProps`: the defaults offer text, one link, images and files on iOS and
 *          text, photos and PDFs on Android; narrowed props narrow both; an invalid type fails.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0478 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { sharingPluginProps } from "../sharing-plugin-props.function";

describe("sharingPluginProps", () => {
  it("offers text, links, photos and PDFs by default", () => {
    expect(sharingPluginProps(undefined)).toEqual({
      ios: {
        enabled: true,
        activationRule: {
          supportsText: true,
          supportsWebUrlWithMaxCount: 1,
          supportsImageWithMaxCount: 10,
          supportsFileWithMaxCount: 10,
        },
      },
      android: {
        enabled: true,
        singleShareMimeTypes: ["text/plain", "image/*", "application/pdf"],
        multipleShareMimeTypes: ["image/*", "application/pdf"],
      },
    });
  });

  it("narrows to photos only and keeps the app group", () => {
    const props = sharingPluginProps({
      text: false,
      links: false,
      fileTypes: ["image/*"],
      maxItems: 3,
      appGroupId: "group.com.figentra.stackra",
    });
    expect(props.ios.appGroupId).toBe("group.com.figentra.stackra");
    expect(props.ios.activationRule).toEqual({
      supportsText: false,
      supportsWebUrlWithMaxCount: 0,
      supportsImageWithMaxCount: 3,
      supportsFileWithMaxCount: 0,
    });
    expect(props.android.singleShareMimeTypes).toEqual(["image/*"]);
  });

  it("fails on a malformed media type", () => {
    expect(() => sharingPluginProps({ fileTypes: ["pdf"] })).toThrow();
  });
});
