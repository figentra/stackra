/**
 * Stackra file contract:
 * Purpose: unit tests of `Capability`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Capability } from "#core/enums/capability.enum";

describe("Capability", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(Capability)).toEqual([
      "network",
      "local_notifications",
      "push",
      "badge",
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
    expect(Capability.Network).toBe("network");
    expectTypeOf(Capability.Network).toEqualTypeOf<"network">();
    expectTypeOf<Capability>().toEqualTypeOf<
      | "network"
      | "local_notifications"
      | "push"
      | "badge"
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
    expect(Object.isFrozen(Capability)).toBe(true);
  });
});
