/**
 * Stackra file contract:
 * Purpose: proves the `.` entry exports the base preset and the five role presets.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import * as entry from "../index.ts";

describe("@stackra/vitest-config entry", () => {
  it("exports the base preset and the role presets", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "appPreset",
      "libraryPreset",
      "mobilePreset",
      "servicePreset",
      "stackraVitest",
      "toolingPreset",
    ]);
  });
});
