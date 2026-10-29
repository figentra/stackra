/**
 * Stackra file contract:
 * Purpose: unit tests of `PlatformCapability`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row);
 *                     STA-1383 (package-qualified: iam owns Capability).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PlatformCapability } from "#core/enums/platform-capability.enum";

describe("PlatformCapability", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(PlatformCapability)).toEqual([
      "network",
      "local_notifications",
      "push",
      "badge",
      "app_icon",
      "clipboard",
      "files_save",
      "print",
      "updates",
      "window",
      "tray",
      "file_handling",
      "share_target",
      "share",
      "haptics",
      "install_prompt",
      "scanner",
      "camera",
      "microphone",
      "usb",
      "bluetooth",
      "serial",
      "card_terminal",
      "required",
      "optional",
    ]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(PlatformCapability.Network).toBe("network");
    expectTypeOf(PlatformCapability.Network).toEqualTypeOf<"network">();
    expectTypeOf<PlatformCapability>().toEqualTypeOf<
      | "network"
      | "local_notifications"
      | "push"
      | "badge"
      | "app_icon"
      | "clipboard"
      | "files_save"
      | "print"
      | "updates"
      | "window"
      | "tray"
      | "file_handling"
      | "share_target"
      | "share"
      | "haptics"
      | "install_prompt"
      | "scanner"
      | "camera"
      | "microphone"
      | "usb"
      | "bluetooth"
      | "serial"
      | "card_terminal"
      | "required"
      | "optional"
    >();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(PlatformCapability)).toBe(true);
  });
});
