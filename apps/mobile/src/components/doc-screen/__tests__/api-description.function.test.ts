/**
 * Stackra file contract:
 * Purpose: proves a prop's description is the Arabic overlay only in Arabic and only when the overlay has the key,
 *          English otherwise, and that a machine-written overlay is flagged.
 * Boundary: the pure function alone; no React.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.4 and owner answer Q3; ADR 0022.
 */
import { describe, expect, it } from "vitest";

import { apiDescription } from "../api-description.function";

const prop = { name: "variant", description: "The emphasis." };
const overlay = {
  _status: "machine",
  free: {
    button: { Button: { variant: "درجة التأكيد." } },
    icon_button: { IconButton: { variant: "درجة الزر." } },
  },
};

describe("apiDescription", () => {
  it("reads English outside Arabic, or when the overlay lacks the key or is missing", () => {
    expect(apiDescription(prop, "free/button", "Button", "en", overlay)).toEqual({
      text: "The emphasis.",
      isMachine: false,
      isFallback: false,
    });
    expect(apiDescription(prop, "free/button", "Button.Label", "ar", overlay)).toEqual({
      text: "The emphasis.",
      isMachine: false,
      isFallback: true,
    });
    expect(apiDescription(prop, "free/button", "Button", "ar", undefined).text).toBe(
      "The emphasis.",
    );
  });

  it("finds a hyphenated slug under its underscored catalogue segment", () => {
    expect(apiDescription(prop, "free/icon-button", "IconButton", "ar", overlay).text).toBe(
      "درجة الزر.",
    );
  });

  it("reads the Arabic overlay and flags a machine pass", () => {
    expect(apiDescription(prop, "free/button", "Button", "ar-EG", overlay)).toEqual({
      text: "درجة التأكيد.",
      isMachine: true,
      isFallback: false,
    });
    expect(
      apiDescription(prop, "free/button", "Button", "ar", { ...overlay, _status: "reviewed" })
        .isMachine,
    ).toBe(false);
  });
});
