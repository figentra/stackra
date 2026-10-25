/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./desktop` entry: `Bridge`, `PickFolderBridge` and `ElectronPlatformDriver`
 *          (the template's desktop wiring imports the last two), and loading it imports no Electron module.
 * Boundary: test only; imports the stand-in barrel through its `#desktop` alias with `electron` mocked to fail on
 *           load, so an eager import would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-24 note; registry A13.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as electron from "#desktop/index";

vi.mock("electron", () => {
  throw new Error("the ./desktop entry must not load Electron eagerly");
});

describe("@stackra/platform/desktop", () => {
  it("exports the bridge kind, the bridges, the main-process drivers and the renderer driver", () => {
    expect(Object.keys(electron).sort()).toEqual([
      "Bridge",
      "ElectronKioskModeDriver",
      "ElectronPlatformDriver",
      "ElectronSecondScreenDriver",
      "PickFolderBridge",
      "SetKioskModeBridge",
      "ShowSecondScreenBridge",
    ]);
  });
});
