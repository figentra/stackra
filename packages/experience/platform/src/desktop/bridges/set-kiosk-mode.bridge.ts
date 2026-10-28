/**
 * Stackra file contract:
 * Purpose: `SetKioskModeBridge` (`platform.kiosk.set`), the renderer's way to switch kiosk mode in main: the till's
 *          settings screen enters it, a manager's override leaves it.
 * Boundary: main process only. The input comes from the renderer, so it is checked before the port is touched; the
 *           answer is the port's `CapabilityResult`, a refusal included, so the renderer branches on it.
 * Runtime: node
 * Governing contract: ADR 0251 (decisions 1 to 3, as amended by 0294); ADR 0281 (kiosk launch mode); registry A13.
 */
import type { KioskMode } from "#contracts/ports/kiosk-mode.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { Bridge } from "#desktop/bases/bridge.base";
import type { SetKioskModeInput } from "#desktop/types/set-kiosk-mode-input.type";

/**
 * Enters or leaves kiosk mode.
 *
 * @example
 * // renderer, through the generated preload
 * await window.stackra.invoke("platform.kiosk.set", { active: true });
 */
export class SetKioskModeBridge extends Bridge({
  key: "kiosk.set",
  capability: PlatformCapability.Window,
}) {
  /** The bound kiosk mode. */
  private readonly kiosk: KioskMode;

  /**
   * @param kiosk - the bound kiosk mode (`ElectronKioskModeDriver`).
   */
  constructor(kiosk: KioskMode) {
    super();
    this.kiosk = kiosk;
  }

  /**
   * Switches kiosk mode.
   *
   * @throws TypeError when `active` is not a boolean.
   */
  async handle(input: SetKioskModeInput): Promise<CapabilityResult> {
    const { active } = (input ?? {}) as Partial<SetKioskModeInput>;
    if (typeof active !== "boolean") throw new TypeError("kiosk.set needs active: true or false");
    return active ? this.kiosk.enter() : this.kiosk.exit();
  }
}
