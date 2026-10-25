/**
 * Stackra file contract:
 * Purpose: unit tests of `SetKioskModeBridge`: a bridge keyed `kiosk.set` of the `window` capability that enters or
 *          leaves kiosk mode on the bound port and refuses a non-boolean before touching it.
 * Boundary: test only; the port is the memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0251 (decisions 1 to 3); ADR 0281.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { MemoryKioskModeDriver } from "#core/drivers/memory-kiosk-mode.driver";
import { SetKioskModeBridge } from "#desktop/bridges/set-kiosk-mode.bridge";
import type { SetKioskModeInput } from "#desktop/types/set-kiosk-mode-input.type";

describe("SetKioskModeBridge", () => {
  it("is the platform.kiosk.set bridge of the window capability", () => {
    expect(kindOf(SetKioskModeBridge)).toEqual({
      kind: "bridge",
      options: { key: "kiosk.set", capability: "window" },
    });
  });

  it("switches kiosk mode", async () => {
    const kiosk = new MemoryKioskModeDriver();
    const bridge = new SetKioskModeBridge(kiosk);
    expect(await bridge.handle({ active: true })).toEqual({ ok: true, data: undefined });
    expect(kiosk.active).toBe(true);
    await bridge.handle({ active: false });
    expect(kiosk.active).toBe(false);
  });

  it("refuses a malformed input", async () => {
    const bridge = new SetKioskModeBridge(new MemoryKioskModeDriver());
    for (const input of [null, {}, { active: "yes" }])
      await expect(bridge.handle(input as unknown as SetKioskModeInput)).rejects.toThrow(TypeError);
  });
});
