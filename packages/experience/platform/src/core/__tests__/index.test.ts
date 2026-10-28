/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every symbol the template and its generated samples import from
 *          `@stackra/platform` (the config vocabulary, `PlatformCapability`, the configurations and `PushConfig$`),
 *          the kiosk launch step, the shipped schemas of the other two configurations, the memory drivers, and not `Platform` (registry A3).
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); the STA-348 registry row.
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";

describe("@stackra/platform", () => {
  it("exports the registry row's symbols, the shipped schemas and the memory drivers", () => {
    expect(Object.keys(core).sort()).toEqual(
      [
        "CachePreset",
        "CacheStrategy",
        "DesktopConfig",
        "DesktopConfig$",
        "DesktopMode",
        "FileLaunchType",
        "InstallMoment",
        "InstallPrompt",
        "KioskConfig",
        "KioskConfig$",
        "MemoryCaptchaVerifierDriver",
        "MemoryKioskModeDriver",
        "MemoryPlatformDriver",
        "MemoryPushTransportDriver",
        "MemorySecondScreenDriver",
        "MemorySystemSettingsDriver",
        "NotificationImportance",
        "OverlayAnchor",
        "OverlayStyle",
        "PlatformCapability",
        "PromptMoment",
        "PushConfig",
        "PushConfig$",
        "PwaConfig",
        "PwaConfig$",
        "TrayClickAction",
        "UpdateStrategy",
        "WindowKind",
        "enterKioskOnLaunch",
      ].sort(),
    );
  });

  it("keeps Platform in ./contracts only", () => {
    expect(core).not.toHaveProperty("Platform");
  });
});
